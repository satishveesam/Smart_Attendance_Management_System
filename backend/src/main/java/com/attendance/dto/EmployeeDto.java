package com.attendance.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDto {
    private Long id;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String department;
    private String designation;
    private LocalDate joiningDate;
    private Long userId;
    private String username;
    private String role;
    private Double customLatitude;
    private Double customLongitude;
    private Double customRadiusMeters;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
    private String assignedShift;
}
