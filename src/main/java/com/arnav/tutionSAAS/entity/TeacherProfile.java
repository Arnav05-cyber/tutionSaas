package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teacher_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeacherProfile {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String bio;

    private String qualification;

    private String linkedinProfile;

    private String upiId;
    private String bankAccountNumber;

    private double payPerClass;
}