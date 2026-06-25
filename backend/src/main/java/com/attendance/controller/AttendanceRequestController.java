package com.attendance.controller;

import com.attendance.dto.AttendanceRequestDto;
import com.attendance.entity.User;
import com.attendance.service.AttendanceRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance-requests")
public class AttendanceRequestController {

    @Autowired
    private AttendanceRequestService requestService;

    @PostMapping("/submit")
    public ResponseEntity<AttendanceRequestDto> submitRequest(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> payload) {
        
        LocalDate date = LocalDate.parse((String) payload.get("date"));
        LocalDateTime checkIn = LocalDateTime.parse((String) payload.get("checkIn"));
        LocalDateTime checkOut = LocalDateTime.parse((String) payload.get("checkOut"));
        String reason = (String) payload.get("reason");

        AttendanceRequestDto dto = requestService.submitRequest(user.getId(), date, checkIn, checkOut, reason);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/my")
    public ResponseEntity<List<AttendanceRequestDto>> getMyRequests(@AuthenticationPrincipal User user) {
        List<AttendanceRequestDto> list = requestService.getEmployeeRequests(user.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<AttendanceRequestDto>> getPendingRequests() {
        List<AttendanceRequestDto> list = requestService.getPendingRequests();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<AttendanceRequestDto>> getAllRequests() {
        List<AttendanceRequestDto> list = requestService.getAllRequests();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<AttendanceRequestDto> approveRequest(@PathVariable("id") Long id) {
        AttendanceRequestDto dto = requestService.approveRequest(id);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<AttendanceRequestDto> rejectRequest(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> payload) {
        String comment = payload.get("comment");
        AttendanceRequestDto dto = requestService.rejectRequest(id, comment);
        return ResponseEntity.ok(dto);
    }
}
