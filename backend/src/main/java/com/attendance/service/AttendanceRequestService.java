package com.attendance.service;

import com.attendance.dto.AttendanceRequestDto;
import com.attendance.entity.*;
import com.attendance.exception.BadRequestException;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.AttendanceRequestRepository;
import com.attendance.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceRequestService {

    @Autowired
    private AttendanceRequestRepository requestRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 15);

    @Transactional
    public AttendanceRequestDto submitRequest(Long userId, LocalDate date, LocalDateTime checkIn, LocalDateTime checkOut, String reason) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));

        // Check if there is already an approved attendance for this date
        Optional<Attendance> existingAttendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), date);
        if (existingAttendance.isPresent()) {
            throw new BadRequestException("An attendance record already exists for " + date + ". If you need changes, contact HR directly.");
        }

        // Create the request
        AttendanceRequest request = AttendanceRequest.builder()
                .employee(employee)
                .attendanceDate(date)
                .checkInTime(checkIn)
                .checkOutTime(checkOut)
                .reason(reason)
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        AttendanceRequest saved = requestRepository.save(request);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRequestDto> getEmployeeRequests(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));
        return requestRepository.findByEmployeeIdOrderByAttendanceDateDesc(employee.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceRequestDto> getPendingRequests() {
        return requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceRequestDto> getAllRequests() {
        return requestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceRequestDto approveRequest(Long requestId) {
        AttendanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is already processed: " + request.getStatus());
        }

        // 1. Set request status to APPROVED
        request.setStatus(RequestStatus.APPROVED);
        request.setAdminComment("Approved by Administrator");
        requestRepository.save(request);

        // 2. Create or update the Attendance record for the employee
        Employee employee = request.getEmployee();
        LocalDate date = request.getAttendanceDate();
        LocalDateTime checkIn = request.getCheckInTime();
        LocalDateTime checkOut = request.getCheckOutTime();

        // Calculate hours
        double hours = Duration.between(checkIn, checkOut).toMinutes() / 60.0;

        // Establish Attendance status
        AttendanceStatus status = AttendanceStatus.PRESENT;
        if (checkIn.toLocalTime().isAfter(LATE_THRESHOLD)) {
            status = AttendanceStatus.LATE;
        }
        if (hours < 4.0) {
            status = AttendanceStatus.HALF_DAY;
        }

        // Retrieve existing or build new
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), date)
                .orElse(new Attendance());

        attendance.setEmployee(employee);
        attendance.setAttendanceDate(date);
        attendance.setCheckIn(checkIn);
        attendance.setCheckOut(checkOut);
        attendance.setTotalHours(hours);
        attendance.setStatus(status);
        attendance.setCheckInAddress("Regularized by Admin Request #" + request.getId());
        attendance.setCheckOutAddress("Regularized by Admin Request #" + request.getId());
        attendance.setCheckInSelfie(""); // empty or placeholder since it's manual
        attendance.setCheckOutSelfie("");

        attendanceRepository.save(attendance);

        return mapToDto(request);
    }

    @Transactional
    public AttendanceRequestDto rejectRequest(Long requestId, String comment) {
        AttendanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is already processed: " + request.getStatus());
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setAdminComment(comment != null && !comment.trim().isEmpty() ? comment : "Rejected by Administrator");
        
        AttendanceRequest saved = requestRepository.save(request);
        return mapToDto(saved);
    }

    private AttendanceRequestDto mapToDto(AttendanceRequest request) {
        Employee employee = request.getEmployee();
        return AttendanceRequestDto.builder()
                .id(request.getId())
                .employeeId(employee.getId())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .employeeCode(employee.getEmployeeCode())
                .attendanceDate(request.getAttendanceDate())
                .checkInTime(request.getCheckInTime())
                .checkOutTime(request.getCheckOutTime())
                .reason(request.getReason())
                .status(request.getStatus().name())
                .adminComment(request.getAdminComment())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
