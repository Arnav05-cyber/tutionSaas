package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "teacher_invites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeacherInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String token; // UUID-based token

    private String email; // Optional — admin can pre-assign to a specific email

    private boolean used = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime expiresAt; // e.g. 7 days from creation
}
