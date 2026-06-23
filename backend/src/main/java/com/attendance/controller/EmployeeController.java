package com.attendance.controller;

import com.attendance.dto.EmployeeDto;
import com.attendance.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @GetMapping("/me")
    public ResponseEntity<EmployeeDto> getMyProfile(@org.springframework.security.core.annotation.AuthenticationPrincipal com.attendance.entity.User user) {
        EmployeeDto dto = employeeService.getEmployeeByUserId(user.getId());
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDto>> getEmployees(@RequestParam(value = "search", required = false) String search) {
        List<EmployeeDto> list = employeeService.searchEmployees(search);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getEmployeeById(@PathVariable("id") Long id) {
        EmployeeDto dto = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> createEmployee(@RequestBody EmployeeDto employeeDto) {
        EmployeeDto created = employeeService.createEmployee(employeeDto);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDto> updateEmployee(@PathVariable("id") Long id, @RequestBody EmployeeDto employeeDto) {
        EmployeeDto updated = employeeService.updateEmployee(id, employeeDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable("id") Long id) {
        employeeService.deleteEmployee(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Employee profile deleted successfully");
        return ResponseEntity.ok(response);
    }
}
