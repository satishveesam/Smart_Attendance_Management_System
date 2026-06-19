package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "face_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Column(name = "image_path")
    private String imagePath;

    @Lob
    @Column(name = "face_descriptor", nullable = false, columnDefinition = "LONGTEXT")
    private String faceDescriptor; // Serialized JSON array of 128 floats
}
