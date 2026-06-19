package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "task_description", nullable = false, length = 1000)
    private String taskDescription;

    @Column(name = "hours_spent", nullable = false)
    private Integer hoursSpent;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;
}
