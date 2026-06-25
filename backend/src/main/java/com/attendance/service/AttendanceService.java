package com.attendance.service;

import com.attendance.dto.*;
import com.attendance.entity.*;
import com.attendance.exception.BadRequestException;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.*;
import com.attendance.util.GeofencingUtils;
import com.attendance.util.QrCodeUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AttendanceLocationRepository locationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private QrSessionRepository qrSessionRepository;

    @Autowired
    private FaceDataRepository faceDataRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OfficeLocationRepository officeLocationRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Value("${attendance.geofence.latitude}")
    private double officeLatitude;

    @Value("${attendance.geofence.longitude}")
    private double officeLongitude;

    @Value("${attendance.geofence.radius-meters}")
    private double officeRadius;

    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 15);

    private OfficeLocation getEffectiveOfficeLocation() {
        return officeLocationRepository.findById(1L)
                .orElseGet(() -> OfficeLocation.builder()
                        .id(1L)
                        .latitude(officeLatitude)
                        .longitude(officeLongitude)
                        .radiusMeters(officeRadius)
                        .build());
    }

    @Transactional
    public AttendanceDto checkIn(Long userId, CheckInRequest request) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for current user account"));

        LocalDate today = LocalDate.now();
        
        // 1. Check if already checked in today
        Optional<Attendance> existingAttendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today);
        if (existingAttendance.isPresent()) {
            throw new BadRequestException("You have already checked in for today!");
        }

        // 2. Geofence Verification
        boolean isWfhToday = false;
        List<LeaveRequest> activeApprovedRequests = leaveRequestRepository.findByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                employee.getId(), LeaveRequest.LeaveStatus.APPROVED, today, today);
        for (LeaveRequest r : activeApprovedRequests) {
            if (r.getLeaveType() == LeaveRequest.LeaveType.WFH) {
                isWfhToday = true;
                break;
            }
        }

        if (!isWfhToday) {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                throw new BadRequestException("GPS Coordinates are required for check-in");
            }
            
            double targetLat, targetLon, targetRadius;
            if (employee.getCustomLatitude() != null && employee.getCustomLongitude() != null && employee.getCustomRadiusMeters() != null) {
                targetLat = employee.getCustomLatitude();
                targetLon = employee.getCustomLongitude();
                targetRadius = employee.getCustomRadiusMeters();
            } else {
                OfficeLocation officeLoc = getEffectiveOfficeLocation();
                targetLat = officeLoc.getLatitude();
                targetLon = officeLoc.getLongitude();
                targetRadius = officeLoc.getRadiusMeters();
            }

            double distance = GeofencingUtils.distance(request.getLatitude(), request.getLongitude(), targetLat, targetLon);
            if (distance > targetRadius) {
                throw new BadRequestException(String.format("Geofence verification failed. You are outside the allowed office area (Distance: %.1f meters, Radius: %.1f meters)", distance, targetRadius));
            }
        }

        // 3. QR Session Verification (Optional, but validated if token is provided)
        if (request.getQrToken() != null && !request.getQrToken().isEmpty()) {
            QrSession qrSession = qrSessionRepository.findByToken(request.getQrToken())
                    .orElseThrow(() -> new BadRequestException("Invalid QR Code Token"));
            if (qrSession.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new BadRequestException("QR Code Token has expired");
            }
        }

        // 4. Face Recognition Verification
        if (request.getFaceDescriptor() != null && !request.getFaceDescriptor().isEmpty()) {
            FaceData faceData = faceDataRepository.findByEmployeeId(employee.getId())
                    .orElseThrow(() -> new BadRequestException("Facial data is not registered for this employee yet. Please register your face profile first."));
            
            try {
                double[] targetDescriptor = objectMapper.readValue(request.getFaceDescriptor(), double[].class);
                double[] registeredDescriptor = objectMapper.readValue(faceData.getFaceDescriptor(), double[].class);
                
                double euclideanDistance = calculateEuclideanDistance(targetDescriptor, registeredDescriptor);
                // Standard face recognition threshold for Euclidean distance is <= 0.6 for match (equivalent to 90% match threshold)
                if (euclideanDistance > 0.6) {
                    throw new BadRequestException(String.format("Facial verification failed. Match confidence below threshold (Distance: %.3f)", euclideanDistance));
                }
            } catch (BadRequestException ex) {
                throw ex;
            } catch (Exception ex) {
                throw new BadRequestException("Error processing facial verification descriptors: " + ex.getMessage());
            }
        } else {
            // Face-descriptor is required for check-in
            throw new BadRequestException("Selfie biometric face scan is required for check-in");
        }

        // 5. Establish Attendance status (Biometric check-ins are PENDING approval)
        LocalDateTime now = LocalDateTime.now();
        AttendanceStatus status = AttendanceStatus.PENDING;

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(today)
                .checkIn(now)
                .status(status)
                .checkInSelfie(request.getSelfieBase64())
                .checkInAddress(request.getAddress())
                .build();

        Attendance savedAttendance = attendanceRepository.save(attendance);

        // 6. Save Location Details
        AttendanceLocation location = AttendanceLocation.builder()
                .attendance(savedAttendance)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationType("CHECK_IN")
                .build();
        
        locationRepository.save(location);

        return mapToDto(savedAttendance);
    }

    @Transactional
    public AttendanceDto checkOut(Long userId, CheckOutRequest request) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for current user account"));

        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                .orElseThrow(() -> new BadRequestException("No check-in record found for today. You must check-in first."));

        if (attendance.getCheckOut() != null) {
            throw new BadRequestException("You have already checked out for today!");
        }

        // 1. Geofence Verification
        boolean isWfhToday = false;
        List<LeaveRequest> activeApprovedRequests = leaveRequestRepository.findByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                employee.getId(), LeaveRequest.LeaveStatus.APPROVED, today, today);
        for (LeaveRequest r : activeApprovedRequests) {
            if (r.getLeaveType() == LeaveRequest.LeaveType.WFH) {
                isWfhToday = true;
                break;
            }
        }

        if (!isWfhToday) {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                throw new BadRequestException("GPS Coordinates are required for check-out");
            }
            
            double targetLat, targetLon, targetRadius;
            if (employee.getCustomLatitude() != null && employee.getCustomLongitude() != null && employee.getCustomRadiusMeters() != null) {
                targetLat = employee.getCustomLatitude();
                targetLon = employee.getCustomLongitude();
                targetRadius = employee.getCustomRadiusMeters();
            } else {
                OfficeLocation officeLoc = getEffectiveOfficeLocation();
                targetLat = officeLoc.getLatitude();
                targetLon = officeLoc.getLongitude();
                targetRadius = officeLoc.getRadiusMeters();
            }

            double distance = GeofencingUtils.distance(request.getLatitude(), request.getLongitude(), targetLat, targetLon);
            if (distance > targetRadius) {
                throw new BadRequestException(String.format("Geofence verification failed. You are outside the allowed office area (Distance: %.1f meters, Radius: %.1f meters)", distance, targetRadius));
            }
        }

        // 2. Face Recognition Verification
        if (request.getFaceDescriptor() != null && !request.getFaceDescriptor().isEmpty()) {
            FaceData faceData = faceDataRepository.findByEmployeeId(employee.getId())
                    .orElseThrow(() -> new BadRequestException("Facial data is not registered for this employee yet. Please register your face profile first."));
            
            try {
                double[] targetDescriptor = objectMapper.readValue(request.getFaceDescriptor(), double[].class);
                double[] registeredDescriptor = objectMapper.readValue(faceData.getFaceDescriptor(), double[].class);
                
                double euclideanDistance = calculateEuclideanDistance(targetDescriptor, registeredDescriptor);
                if (euclideanDistance > 0.6) {
                    throw new BadRequestException(String.format("Facial verification failed. Match confidence below threshold (Distance: %.3f)", euclideanDistance));
                }
            } catch (BadRequestException ex) {
                throw ex;
            } catch (Exception ex) {
                throw new BadRequestException("Error processing facial verification descriptors: " + ex.getMessage());
            }
        } else {
            throw new BadRequestException("Selfie biometric face scan is required for check-out");
        }

        // 3. Save checkout details
        LocalDateTime now = LocalDateTime.now();
        attendance.setCheckOut(now);
        attendance.setCheckOutSelfie(request.getSelfie());
        attendance.setCheckOutAddress(request.getAddress());
        
        // Calculate Total Working Hours
        double hours = Duration.between(attendance.getCheckIn(), now).toMinutes() / 60.0;
        attendance.setTotalHours(hours);
        attendance.setStatus(AttendanceStatus.PENDING);

        Attendance savedAttendance = attendanceRepository.save(attendance);

        // Save Location details
        AttendanceLocation location = AttendanceLocation.builder()
                .attendance(savedAttendance)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationType("CHECK_OUT")
                .build();
        
        locationRepository.save(location);

        return mapToDto(savedAttendance);
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> getEmployeeAttendanceHistory(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));
        return attendanceRepository.findByEmployeeId(employee.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> getAllHistory(LocalDate startDate, LocalDate endDate, Long employeeId) {
        List<Attendance> list;
        if (employeeId != null) {
            list = attendanceRepository.findByEmployeeIdAndAttendanceDateBetween(employeeId, startDate, endDate);
        } else {
            list = attendanceRepository.findByAttendanceDateBetween(startDate, endDate);
        }
        return list.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public String generateDailyQrToken() {
        // Generate daily token
        String token = UUID.randomUUID().toString();
        
        // Session expires at the end of the current day
        LocalDateTime expiresAt = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        
        QrSession qrSession = QrSession.builder()
                .token(token)
                .createdAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .build();
                
        qrSessionRepository.save(qrSession);
        return token;
    }

    @Transactional(readOnly = true)
    public byte[] getQrCodeBase64(String token) throws Exception {
        return QrCodeUtils.generateQrCodeImage(token, 300, 300);
    }

    private double calculateEuclideanDistance(double[] desc1, double[] desc2) {
        if (desc1.length != desc2.length) {
            throw new IllegalArgumentException("Descriptors length mismatch: " + desc1.length + " vs " + desc2.length);
        }
        double sum = 0.0;
        for (int i = 0; i < desc1.length; i++) {
            double diff = desc1[i] - desc2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    public AttendanceDto mapToDto(Attendance attendance) {
        List<AttendanceLocation> locations = locationRepository.findByAttendanceId(attendance.getId());
        
        Double inLat = null, inLon = null, outLat = null, outLon = null;
        for (AttendanceLocation loc : locations) {
            if ("CHECK_IN".equalsIgnoreCase(loc.getLocationType())) {
                inLat = loc.getLatitude();
                inLon = loc.getLongitude();
            } else if ("CHECK_OUT".equalsIgnoreCase(loc.getLocationType())) {
                outLat = loc.getLatitude();
                outLon = loc.getLongitude();
            }
        }

        return AttendanceDto.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeCode(attendance.getEmployee().getEmployeeCode())
                .employeeName(attendance.getEmployee().getFirstName() + " " + attendance.getEmployee().getLastName())
                .attendanceDate(attendance.getAttendanceDate())
                .checkIn(attendance.getCheckIn())
                .checkOut(attendance.getCheckOut())
                .totalHours(attendance.getTotalHours())
                .status(attendance.getStatus().name())
                .checkInLatitude(inLat)
                .checkInLongitude(inLon)
                .checkOutLatitude(outLat)
                .checkOutLongitude(outLon)
                .checkInSelfie(attendance.getCheckInSelfie())
                .checkOutSelfie(attendance.getCheckOutSelfie())
                .checkInAddress(attendance.getCheckInAddress())
                .checkOutAddress(attendance.getCheckOutAddress())
                .build();
    }

    @Transactional(readOnly = true)
    public OfficeLocation getOfficeLocation() {
        return getEffectiveOfficeLocation();
    }

    @Transactional
    public OfficeLocation updateOfficeLocation(OfficeLocation newLocation) {
        newLocation.setId(1L);
        return officeLocationRepository.save(newLocation);
    }

    @Transactional
    public AttendanceDto approveAttendance(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        
        // Calculate approved status based on check-in time and total hours
        LocalDateTime checkIn = attendance.getCheckIn();
        LocalDateTime checkOut = attendance.getCheckOut();
        
        AttendanceStatus status = AttendanceStatus.PRESENT;
        
        // Check if WFH (active approved WFH request on that date)
        LocalDate date = attendance.getAttendanceDate();
        boolean isWfhToday = false;
        List<LeaveRequest> activeApprovedRequests = leaveRequestRepository.findByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                attendance.getEmployee().getId(), LeaveRequest.LeaveStatus.APPROVED, date, date);
        for (LeaveRequest r : activeApprovedRequests) {
            if (r.getLeaveType() == LeaveRequest.LeaveType.WFH) {
                isWfhToday = true;
                break;
            }
        }

        if (isWfhToday) {
            status = AttendanceStatus.WFH;
        } else {
            // Check if late
            if (checkIn != null && checkIn.toLocalTime().isAfter(LATE_THRESHOLD)) {
                status = AttendanceStatus.LATE;
            }
            // Check if half day (working hours < 4 hours, only if checked out)
            if (checkOut != null) {
                double hours = Duration.between(checkIn, checkOut).toMinutes() / 60.0;
                attendance.setTotalHours(hours);
                if (hours < 4.0) {
                    status = AttendanceStatus.HALF_DAY;
                }
            }
        }
        
        attendance.setStatus(status);
        Attendance saved = attendanceRepository.save(attendance);
        return mapToDto(saved);
    }

    @Transactional
    public AttendanceDto rejectAttendance(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        
        attendance.setStatus(AttendanceStatus.ABSENT);
        Attendance saved = attendanceRepository.save(attendance);
        return mapToDto(saved);
    }
}
