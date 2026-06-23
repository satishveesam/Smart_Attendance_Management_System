package com.attendance.controller;

import com.attendance.dto.AttendanceDto;
import com.attendance.dto.CheckInRequest;
import com.attendance.dto.CheckOutRequest;
import com.attendance.entity.OfficeLocation;
import com.attendance.entity.User;
import com.attendance.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/checkin")
    public ResponseEntity<AttendanceDto> checkIn(@AuthenticationPrincipal User user, @Valid @RequestBody CheckInRequest request) {
        AttendanceDto dto = attendanceService.checkIn(user.getId(), request);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/checkout")
    public ResponseEntity<AttendanceDto> checkOut(@AuthenticationPrincipal User user, @RequestBody CheckOutRequest request) {
        AttendanceDto dto = attendanceService.checkOut(user.getId(), request);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AttendanceDto>> getPersonalHistory(@AuthenticationPrincipal User user) {
        List<AttendanceDto> history = attendanceService.getEmployeeAttendanceHistory(user.getId());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/generate-qr")
    public ResponseEntity<?> generateQrToken() {
        String token = attendanceService.generateDailyQrToken();
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/qr-code/{token}")
    public ResponseEntity<byte[]> getQrCodeImage(@PathVariable("token") String token) {
        try {
            byte[] imageBytes = attendanceService.getQrCodeBase64(token);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/office-location")
    public ResponseEntity<OfficeLocation> getOfficeLocation() {
        return ResponseEntity.ok(attendanceService.getOfficeLocation());
    }

    @PostMapping("/office-location")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OfficeLocation> updateOfficeLocation(@RequestBody OfficeLocation location) {
        return ResponseEntity.ok(attendanceService.updateOfficeLocation(location));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceDto>> getPendingAttendances() {
        return ResponseEntity.ok(attendanceService.getPendingAttendances());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AttendanceDto> approveAttendance(@PathVariable("id") Long id) {
        return ResponseEntity.ok(attendanceService.approvePendingAttendance(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AttendanceDto> rejectAttendance(@PathVariable("id") Long id) {
        return ResponseEntity.ok(attendanceService.rejectPendingAttendance(id));
    }
}
