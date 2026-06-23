package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_code", unique = true, nullable = false, length = 50)
    private String employeeCode;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String designation;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name = "custom_latitude")
    private Double customLatitude;

    @Column(name = "custom_longitude")
    private Double customLongitude;

    @Column(name = "custom_radius_meters")
    private Double customRadiusMeters;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "ifsc_code", length = 20)
    private String ifscCode;

    @Column(name = "branch_name", length = 100)
    private String branchName;

    @Column(name = "basic_pay")
    private Double basicPay;

    @Column(name = "hra")
    private Double hra;

    @Column(name = "special_allowance")
    private Double specialAllowance;

    @Column(name = "deductions")
    private Double deductions;

    @Column(name = "net_take_home")
    private Double netTakeHome;

    @Column(name = "roster_schedule", length = 255)
    private String rosterSchedule;
}
