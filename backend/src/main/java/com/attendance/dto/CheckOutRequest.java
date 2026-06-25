package com.attendance.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckOutRequest {
    private Double latitude;
    private Double longitude;
    private String faceDescriptor; // JSON array of 128 floats
    private String selfie;  // Base64 encoded selfie frame
    private String address; // Resolved address string
    private Boolean locationSimulated;
    private Double actualDistance;
}
