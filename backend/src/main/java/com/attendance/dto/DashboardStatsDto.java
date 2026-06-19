package com.attendance.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalEmployees;
    private long presentToday;
    private long absentToday;
    private long lateArrivals;
    private double attendancePercentage;
}
