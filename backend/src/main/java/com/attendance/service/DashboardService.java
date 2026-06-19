package com.attendance.service;

import com.attendance.dto.DashboardStatsDto;
import com.attendance.entity.AttendanceStatus;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDto getAdminDashboardStats() {
        long totalEmployees = employeeRepository.count();
        LocalDate today = LocalDate.now();
        
        long presentToday = attendanceRepository.countPresentToday(today);
        long lateToday = attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.LATE);
        long absentToday = totalEmployees - presentToday;
        if (absentToday < 0) {
            absentToday = 0;
        }

        double attendancePercentage = totalEmployees > 0 
                ? ((double) presentToday / totalEmployees) * 100.0 
                : 0.0;

        return DashboardStatsDto.builder()
                .totalEmployees(totalEmployees)
                .presentToday(presentToday)
                .absentToday(absentToday)
                .lateArrivals(lateToday)
                .attendancePercentage(attendancePercentage)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAdminDashboardCharts() {
        List<Map<String, Object>> chartData = new ArrayList<>();
        LocalDate today = LocalDate.now();
        
        // Fetch last 7 days metrics
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            long present = attendanceRepository.countPresentToday(date);
            long late = attendanceRepository.countByAttendanceDateAndStatus(date, AttendanceStatus.LATE);
            
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("present", present);
            dayData.put("late", late);
            chartData.add(dayData);
        }
        
        return chartData;
    }
}
