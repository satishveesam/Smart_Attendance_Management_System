package com.attendance.service;

import com.attendance.dto.WorkEntryDto;
import com.attendance.entity.Employee;
import com.attendance.entity.WorkEntry;
import com.attendance.exception.BadRequestException;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.EmployeeRepository;
import com.attendance.repository.WorkEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WorkEntryService {

    @Autowired
    private WorkEntryRepository workEntryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Transactional
    public WorkEntryDto submitWorkEntry(Long userId, WorkEntryDto dto) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));

        LocalDate entryDate = dto.getEntryDate() != null ? dto.getEntryDate() : LocalDate.now();

        if (dto.getTaskDescription() == null || dto.getTaskDescription().trim().isEmpty()) {
            throw new BadRequestException("Task description is required");
        }

        if (dto.getHoursSpent() == null || dto.getHoursSpent() <= 0) {
            throw new BadRequestException("Hours spent must be a positive integer");
        }

        Optional<WorkEntry> existingOpt = workEntryRepository.findByEmployeeIdAndEntryDate(employee.getId(), entryDate);
        WorkEntry workEntry;

        if (existingOpt.isPresent()) {
            workEntry = existingOpt.get();
            workEntry.setTaskDescription(dto.getTaskDescription());
            workEntry.setHoursSpent(dto.getHoursSpent());
            workEntry.setSubmittedAt(LocalDateTime.now());
        } else {
            workEntry = WorkEntry.builder()
                    .employee(employee)
                    .entryDate(entryDate)
                    .taskDescription(dto.getTaskDescription())
                    .hoursSpent(dto.getHoursSpent())
                    .submittedAt(LocalDateTime.now())
                    .build();
        }

        WorkEntry saved = workEntryRepository.save(workEntry);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkEntryDto> getMyWorkEntries(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));

        return workEntryRepository.findByEmployeeIdOrderByEntryDateDesc(employee.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkEntryDto> getAllWorkEntries(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusMonths(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        return workEntryRepository.findByEntryDateBetweenOrderByEntryDateDesc(start, end).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private WorkEntryDto mapToDto(WorkEntry entry) {
        return WorkEntryDto.builder()
                .id(entry.getId())
                .employeeId(entry.getEmployee().getId())
                .employeeName(entry.getEmployee().getFirstName() + " " + entry.getEmployee().getLastName())
                .employeeCode(entry.getEmployee().getEmployeeCode())
                .entryDate(entry.getEntryDate())
                .taskDescription(entry.getTaskDescription())
                .hoursSpent(entry.getHoursSpent())
                .submittedAt(entry.getSubmittedAt())
                .build();
    }
}
