package com.attendance.controller;

import com.attendance.dto.WorkEntryDto;
import com.attendance.entity.User;
import com.attendance.service.WorkEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/work-entries")
public class WorkEntryController {

    @Autowired
    private WorkEntryService workEntryService;

    @PostMapping("/submit")
    public ResponseEntity<WorkEntryDto> submitWorkEntry(
            @AuthenticationPrincipal User user,
            @RequestBody WorkEntryDto dto) {
        WorkEntryDto result = workEntryService.submitWorkEntry(user.getId(), dto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my")
    public ResponseEntity<List<WorkEntryDto>> getMyWorkEntries(@AuthenticationPrincipal User user) {
        List<WorkEntryDto> list = workEntryService.getMyWorkEntries(user.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WorkEntryDto>> getAllWorkEntries(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkEntryDto> list = workEntryService.getAllWorkEntries(startDate, endDate);
        return ResponseEntity.ok(list);
    }
}
