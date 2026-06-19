package com.attendance.controller;

import com.attendance.dto.LeaveRequestDto;
import com.attendance.entity.User;
import com.attendance.service.LeaveRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

    @Autowired
    private LeaveRequestService leaveRequestService;

    @PostMapping
    public ResponseEntity<LeaveRequestDto> applyLeave(@AuthenticationPrincipal User user, @RequestBody LeaveRequestDto dto) {
        LeaveRequestDto created = leaveRequestService.applyLeave(user.getId(), dto);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/my")
    public ResponseEntity<List<LeaveRequestDto>> getMyLeaves(@AuthenticationPrincipal User user) {
        List<LeaveRequestDto> myLeaves = leaveRequestService.getMyLeaves(user.getId());
        return ResponseEntity.ok(myLeaves);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LeaveRequestDto>> getPendingLeaves() {
        List<LeaveRequestDto> pending = leaveRequestService.getPendingLeaves();
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeaveRequestDto> approveLeave(@AuthenticationPrincipal User adminUser, @PathVariable("id") Long leaveId) {
        LeaveRequestDto processed = leaveRequestService.approveLeave(leaveId, adminUser.getUsername());
        return ResponseEntity.ok(processed);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeaveRequestDto> rejectLeave(@AuthenticationPrincipal User adminUser, @PathVariable("id") Long leaveId) {
        LeaveRequestDto processed = leaveRequestService.rejectLeave(leaveId, adminUser.getUsername());
        return ResponseEntity.ok(processed);
    }
}
