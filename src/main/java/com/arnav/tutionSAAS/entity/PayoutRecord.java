package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "payout_records",
    uniqueConstraints = @UniqueConstraint(columnNames = {"teacher_id", "month"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayoutRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(nullable = false)
    private String month; // Stored as "2026-05" (YearMonth as String)

    private int classesCompleted;

    private double ratePerClass; // Snapshot from TeacherProfile at generation time

    private double totalAmount; // classesCompleted × ratePerClass

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status = PayoutStatus.PENDING;

    private LocalDateTime paidAt; // Set when Admin marks as paid

    private LocalDateTime createdAt = LocalDateTime.now();
}
