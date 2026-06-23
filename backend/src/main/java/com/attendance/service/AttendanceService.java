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
        
        // Check if shift time has ended (skip for weekly offs)
        if (!isWeekOff(employee, today) && isAfterShiftEndTime(employee)) {
            throw new BadRequestException("Your shift time has ended. Check-in is no longer allowed for today.");
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

            // Geofence check is logged, but we no longer throw exception so employees can check in from other locations
            double distance = GeofencingUtils.distance(request.getLatitude(), request.getLongitude(), targetLat, targetLon);
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
                // Tighten threshold to 0.45 for strict security verification
                if (euclideanDistance > 0.45) {
                    throw new BadRequestException("Face does not match registered profile. Verification failed.");
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

        // 5. Establish Attendance status
        LocalDateTime now = LocalDateTime.now();
        AttendanceStatus status = AttendanceStatus.PENDING;

        Attendance savedAttendance;
        if (existingAttendance.isPresent()) {
            Attendance attendance = existingAttendance.get();
            if (attendance.getCheckOut() == null) {
                throw new BadRequestException("You are already checked in. You must check-out first.");
            }
            
            // Allow multiple check-ins: clear checkOut, checkOutSelfie, checkOutAddress, update checkIn, checkInSelfie, checkInAddress, status
            attendance.setCheckIn(now);
            attendance.setCheckOut(null);
            attendance.setCheckOutSelfie(null);
            attendance.setCheckOutAddress(null);
            attendance.setCheckInSelfie(request.getSelfieBase64());
            attendance.setCheckInAddress(request.getAddress());
            attendance.setStatus(status);
            
            savedAttendance = attendanceRepository.save(attendance);
        } else {
            Attendance attendance = Attendance.builder()
                    .employee(employee)
                    .attendanceDate(today)
                    .checkIn(now)
                    .status(status)
                    .checkInSelfie(request.getSelfieBase64())
                    .checkInAddress(request.getAddress())
                    .build();

            savedAttendance = attendanceRepository.save(attendance);
        }

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

            // Geofence check is logged, but we no longer throw exception so employees can check out from other locations
            double distance = GeofencingUtils.distance(request.getLatitude(), request.getLongitude(), targetLat, targetLon);
        }

        // 2. Face Recognition Verification
        if (request.getFaceDescriptor() != null && !request.getFaceDescriptor().isEmpty()) {
            FaceData faceData = faceDataRepository.findByEmployeeId(employee.getId())
                    .orElseThrow(() -> new BadRequestException("Facial data is not registered for this employee yet. Please register your face profile first."));
            
            try {
                double[] targetDescriptor = objectMapper.readValue(request.getFaceDescriptor(), double[].class);
                double[] registeredDescriptor = objectMapper.readValue(faceData.getFaceDescriptor(), double[].class);
                
                double euclideanDistance = calculateEuclideanDistance(targetDescriptor, registeredDescriptor);
                if (euclideanDistance > 0.45) {
                    throw new BadRequestException("Face does not match registered profile. Verification failed.");
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
        
        // Calculate Total Working Hours (accumulate over multiple check-in/check-out sessions)
        double currentSessionHours = Duration.between(attendance.getCheckIn(), now).toMinutes() / 60.0;
        double previousHours = attendance.getTotalHours() != null ? attendance.getTotalHours() : 0.0;
        attendance.setTotalHours(previousHours + currentSessionHours);

        // Keep status as PENDING — admin will resolve it to PRESENT/LATE/HALF_DAY at approval
        // (Do NOT override PENDING with HALF_DAY here)

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

    private boolean isWeekOff(Employee employee, LocalDate date) {
        String schedule = employee.getRosterSchedule();
        if (schedule == null || schedule.isEmpty()) {
            DayOfWeek day = date.getDayOfWeek();
            return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
        }

        String lowerSchedule = schedule.toLowerCase();
        DayOfWeek day = date.getDayOfWeek();
        String dayName = day.name().toLowerCase();

        int offsIndex = lowerSchedule.indexOf("offs");
        if (offsIndex == -1) {
            offsIndex = lowerSchedule.indexOf("off");
        }

        if (offsIndex != -1) {
            String offsPart = lowerSchedule.substring(offsIndex);
            return offsPart.contains(dayName);
        }

        if (lowerSchedule.contains("monday to friday") || lowerSchedule.contains("mon-fri") || lowerSchedule.contains("mon to fri")) {
            return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
        }

        if (!lowerSchedule.contains("sat") && !lowerSchedule.contains("sun") && 
            !lowerSchedule.contains("mon") && !lowerSchedule.contains("tue") && 
            !lowerSchedule.contains("wed") && !lowerSchedule.contains("thu") && 
            !lowerSchedule.contains("fri")) {
            return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
        }

        return lowerSchedule.contains(dayName);
    }

    private boolean isAfterShiftEndTime(Employee employee) {
        String schedule = employee.getRosterSchedule();
        // Default shift end time is 18:30 (06:30 PM)
        int endHour = 18;
        int endMinute = 30;

        if (schedule != null && !schedule.isEmpty()) {
            // Regex to find all times like 06:30 PM or 6:30 PM or 18:30
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d{1,2}):(\\d{2})\\s*(AM|PM)", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(schedule);
            
            List<String[]> matches = new ArrayList<>();
            while (matcher.find()) {
                matches.add(new String[]{matcher.group(1), matcher.group(2), matcher.group(3)});
            }
            
            if (matches.size() >= 2) {
                // Usually the second matched time is the end time
                String[] endMatch = matches.get(1);
                try {
                    int hour = Integer.parseInt(endMatch[0]);
                    int minute = Integer.parseInt(endMatch[1]);
                    String ampm = endMatch[2].toUpperCase();
                    
                    if ("PM".equals(ampm) && hour < 12) {
                        hour += 12;
                    } else if ("AM".equals(ampm) && hour == 12) {
                        hour = 0;
                    }
                    endHour = hour;
                    endMinute = minute;
                } catch (Exception e) {
                    // Ignore and fall back to default
                }
            }
        }

        LocalTime now = LocalTime.now();
        LocalTime shiftEnd = LocalTime.of(endHour, endMinute);
        return now.isAfter(shiftEnd);
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

        String checkInLocType = "-";
        String checkOutLocType = "-";

        try {
            Employee employee = attendance.getEmployee();
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

            if (inLat != null && inLon != null) {
                double distance = GeofencingUtils.distance(inLat, inLon, targetLat, targetLon);
                checkInLocType = (distance <= targetRadius) ? "Office Location" : "Other Location";
            }
            if (outLat != null && outLon != null) {
                double distance = GeofencingUtils.distance(outLat, outLon, targetLat, targetLon);
                checkOutLocType = (distance <= targetRadius) ? "Office Location" : "Other Location";
            }
        } catch (Exception e) {
            // fallback
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
                .checkInLocationType(checkInLocType)
                .checkOutLocationType(checkOutLocType)
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

    @Transactional(readOnly = true)
    public List<AttendanceDto> getPendingAttendances() {
        return attendanceRepository.findByStatusOrderByAttendanceDateDescCheckInDesc(AttendanceStatus.PENDING)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceDto approvePendingAttendance(Long attendanceId) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        if (attendance.getStatus() != AttendanceStatus.PENDING) {
            throw new BadRequestException("Attendance record is not in PENDING state");
        }

        LocalDate date = attendance.getAttendanceDate();
        Employee employee = attendance.getEmployee();

        // Re-check if employee had approved WFH leave on that date
        boolean isWfh = false;
        List<LeaveRequest> activeApprovedRequests = leaveRequestRepository
                .findByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employee.getId(), LeaveRequest.LeaveStatus.APPROVED, date, date);
        for (LeaveRequest r : activeApprovedRequests) {
            if (r.getLeaveType() == LeaveRequest.LeaveType.WFH) {
                isWfh = true;
                break;
            }
        }

        // Determine final status based on actual check-in time and hours worked
        AttendanceStatus finalStatus;
        if (isWeekOff(employee, date)) {
            finalStatus = AttendanceStatus.EXTRA_SHIFT;
        } else if (isWfh) {
            finalStatus = AttendanceStatus.WFH;
        } else if (attendance.getTotalHours() != null && attendance.getTotalHours() < 4.0) {
            finalStatus = AttendanceStatus.HALF_DAY;
        } else if (attendance.getCheckIn() != null && attendance.getCheckIn().toLocalTime().isAfter(LATE_THRESHOLD)) {
            finalStatus = AttendanceStatus.LATE;
        } else {
            finalStatus = AttendanceStatus.PRESENT;
        }

        attendance.setStatus(finalStatus);
        return mapToDto(attendanceRepository.save(attendance));
    }

    @Transactional
    public AttendanceDto rejectPendingAttendance(Long attendanceId) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        if (attendance.getStatus() != AttendanceStatus.PENDING) {
            throw new BadRequestException("Attendance record is not in PENDING state");
        }
        attendance.setStatus(AttendanceStatus.ABSENT);
        return mapToDto(attendanceRepository.save(attendance));
    }
}
