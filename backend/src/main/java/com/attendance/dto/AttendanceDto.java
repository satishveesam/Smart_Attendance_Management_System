package com.attendance.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDto {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private LocalDate attendanceDate;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private Double totalHours;
    private String status;
    private Double checkInLatitude;
    private Double checkInLongitude;
    private Double checkOutLatitude;
    private Double checkOutLongitude;
    private String checkInSelfie;
    private String checkOutSelfie;
    private String checkInAddress;
    private String checkOutAddress;
    private Boolean checkInLocationSimulated;
    private Double checkInActualDistance;
    private Boolean checkOutLocationSimulated;
    private Double checkOutActualDistance;
}
