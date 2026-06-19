package com.attendance.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegisterRequest {
    private String faceDescriptor; // JSON array of 128 floats
}
