package com.attendance.service;

import com.attendance.dto.AttendanceDto;
import com.attendance.entity.Attendance;
import com.attendance.entity.Employee;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.EmployeeRepository;
import com.attendance.util.ExcelReportUtils;
import com.attendance.util.PdfReportUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceService attendanceService;

    @Transactional(readOnly = true)
    public List<AttendanceDto> getAttendanceReport(LocalDate startDate, LocalDate endDate, Long employeeId, String department) {
        List<Attendance> list;
        if (employeeId != null) {
            list = attendanceRepository.findByEmployeeIdAndAttendanceDateBetween(employeeId, startDate, endDate);
        } else {
            list = attendanceRepository.findByAttendanceDateBetween(startDate, endDate);
        }

        return list.stream()
                .map(attendanceService::mapToDto)
                .filter(dto -> {
                    if (department == null || department.trim().isEmpty()) {
                        return true;
                    }
                    Employee emp = employeeRepository.findById(dto.getEmployeeId()).orElse(null);
                    return emp != null && emp.getDepartment() != null && emp.getDepartment().equalsIgnoreCase(department.trim());
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] exportPdfReport(LocalDate startDate, LocalDate endDate, Long employeeId, String department) {
        List<AttendanceDto> reportData = getAttendanceReport(startDate, endDate, employeeId, department);
        return PdfReportUtils.generateAttendancePdfReport(reportData);
    }

    @Transactional(readOnly = true)
    public byte[] exportExcelReport(LocalDate startDate, LocalDate endDate, Long employeeId, String department) throws Exception {
        List<AttendanceDto> reportData = getAttendanceReport(startDate, endDate, employeeId, department);
        return ExcelReportUtils.generateAttendanceExcelReport(reportData);
    }
}
