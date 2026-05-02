package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String clerkId;

    private String fullName;

    @Column(unique = true)
    private String email;

    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String grade; // Store as "9", "10", "11", or "12"

    private boolean isApproved = false; // Admin manually approves teachers

    private boolean onboardingComplete = false; // True once they give phone/grade

    private LocalDateTime createdAt = LocalDateTime.now();

}
