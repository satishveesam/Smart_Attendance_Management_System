package com.attendance.controller;

import com.attendance.dto.DashboardStatsDto;
import com.attendance.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/admin/stats")
    public ResponseEntity<DashboardStatsDto> getAdminStats() {
        DashboardStatsDto stats = dashboardService.getAdminDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/admin/charts")
    public ResponseEntity<List<Map<String, Object>>> getAdminCharts() {
        List<Map<String, Object>> charts = dashboardService.getAdminDashboardCharts();
        return ResponseEntity.ok(charts);
    }
}
