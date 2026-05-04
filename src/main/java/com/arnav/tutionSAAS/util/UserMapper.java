package com.arnav.tutionSAAS.util;

import com.arnav.tutionSAAS.dto.OnboardingRequest;
import com.arnav.tutionSAAS.entity.*;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class UserMapper {

    public User toUserEntity(String clerkId, String email, OnboardingRequest dto) {
        User user = new User();
        user.setClerkId(clerkId);
        user.setEmail(email);
        user.setFullName(dto.getFullName());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setRole(Role.valueOf(dto.getRole().toUpperCase()));
        user.setGrade(dto.getGrade());
        user.setOnboardingComplete(true);
        user.setCreatedAt(LocalDateTime.now());

        // Students are auto-approved, Teachers wait for Admin
        if (user.getRole() == Role.STUDENT) {
            user.setApproved(true);
        }

        return user;
    }

    public TeacherProfile toTeacherProfile(User user, OnboardingRequest dto) {
        TeacherProfile profile = new TeacherProfile();
        profile.setUser(user);
        profile.setLinkedinProfile(dto.getLinkedinUrl());
        // Default values or placeholders
        profile.setPayPerClass(0.0);
        return profile;
    }

    public StudentProfile toStudentProfile(User user) {
        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setFeesPaidForCurrentMonth(false);
        return profile;
    }
}