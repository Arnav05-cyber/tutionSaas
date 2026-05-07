package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * An individual class session created by the teacher for a specific date.
 * The teacher provides a Google Meet link for each session.
 */
@Entity
@Table(name = "class_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    private String title; // e.g. "Hamlet Act 3 Discussion"

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    private int durationMinutes = 60;

    @Column(length = 500)
    private String googleMeetLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.SCHEDULED;

    private boolean reminderSent = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
