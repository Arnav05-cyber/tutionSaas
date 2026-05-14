package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Logs when a student clicks "Join Class" to track who actually
 * joined a session. Teacher/admin can view these logs to decide attendance.
 */
@Entity
@Table(
    name = "session_join_logs",
    uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "student_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SessionJoinLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ClassSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    private LocalDateTime joinedAt = LocalDateTime.now();
}
