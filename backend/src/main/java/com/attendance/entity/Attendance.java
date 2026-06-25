package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "check_in")
    private LocalDateTime checkIn;

    @Column(name = "check_out")
    private LocalDateTime checkOut;

    @Column(name = "total_hours")
    private Double totalHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status;

    @Lob
    @Column(name = "check_in_selfie", columnDefinition = "LONGTEXT")
    private String checkInSelfie;

    @Lob
    @Column(name = "check_out_selfie", columnDefinition = "LONGTEXT")
    private String checkOutSelfie;

    @Column(name = "check_in_address", length = 255)
    private String checkInAddress;

    @Column(name = "check_out_address", length = 255)
    private String checkOutAddress;

    @Column(name = "check_in_location_simulated")
    private Boolean checkInLocationSimulated;

    @Column(name = "check_in_actual_distance")
    private Double checkInActualDistance;

    @Column(name = "check_out_location_simulated")
    private Boolean checkOutLocationSimulated;

    @Column(name = "check_out_actual_distance")
    private Double checkOutActualDistance;
}
