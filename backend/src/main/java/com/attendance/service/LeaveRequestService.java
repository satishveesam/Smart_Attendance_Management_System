package com.attendance.service;

import com.attendance.dto.LeaveRequestDto;
import com.attendance.entity.*;
import com.attendance.exception.BadRequestException;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.EmployeeRepository;
import com.attendance.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveRequestService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Transactional
    public LeaveRequestDto applyLeave(Long userId, LeaveRequestDto dto) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));

        if (dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new BadRequestException("Start date and end date are required");
        }
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new BadRequestException("Start date cannot be after end date");
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(LeaveRequest.LeaveType.valueOf(dto.getLeaveType()))
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveRequest.LeaveStatus.PENDING)
                .appliedOn(LocalDateTime.now())
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getMyLeaves(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));

        return leaveRequestRepository.findByEmployeeIdOrderByAppliedOnDesc(employee.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getPendingLeaves() {
        return leaveRequestRepository.findByStatusOrderByAppliedOnDesc(LeaveRequest.LeaveStatus.PENDING).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveRequestDto approveLeave(Long leaveId, String adminUsername) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        request.setStatus(LeaveRequest.LeaveStatus.APPROVED);
        request.setApprovedBy(adminUsername);
        LeaveRequest saved = leaveRequestRepository.save(request);

        // If it's a leave type (not WFH), pre-populate Attendance records with status LEAVE
        if (request.getLeaveType() != LeaveRequest.LeaveType.WFH) {
            LocalDate start = request.getStartDate();
            LocalDate end = request.getEndDate();
            while (!start.isAfter(end)) {
                // Check if attendance already exists
                boolean exists = attendanceRepository.findByEmployeeIdAndAttendanceDate(request.getEmployee().getId(), start).isPresent();
                if (!exists) {
                    Attendance attendance = Attendance.builder()
                            .employee(request.getEmployee())
                            .attendanceDate(start)
                            .status(AttendanceStatus.LEAVE)
                            .totalHours(8.0) // Standard workday hours credited
                            .build();
                    attendanceRepository.save(attendance);
                }
                start = start.plusDays(1);
            }
        }

        return mapToDto(saved);
    }

    @Transactional
    public LeaveRequestDto rejectLeave(Long leaveId, String adminUsername) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        request.setStatus(LeaveRequest.LeaveStatus.REJECTED);
        request.setApprovedBy(adminUsername);
        LeaveRequest saved = leaveRequestRepository.save(request);
        return mapToDto(saved);
    }

    private LeaveRequestDto mapToDto(LeaveRequest request) {
        String empName = request.getEmployee().getFirstName() + " " + request.getEmployee().getLastName();
        return LeaveRequestDto.builder()
                .id(request.getId())
                .employeeId(request.getEmployee().getId())
                .employeeName(empName)
                .employeeCode(request.getEmployee().getEmployeeCode())
                .leaveType(request.getLeaveType().name())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .status(request.getStatus().name())
                .appliedOn(request.getAppliedOn())
                .approvedBy(request.getApprovedBy())
                .build();
    }
}
