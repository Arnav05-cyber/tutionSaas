package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String parentLinkCode; // 6-char code like "A3X9K2", student generates & shares with parent

    private boolean isFeesPaidForCurrentMonth = false;
}