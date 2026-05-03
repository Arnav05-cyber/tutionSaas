package com.arnav.tutionSAAS.dto;

import lombok.Data;

@Data
public class OnboardingRequest {
    private String fullName;
    private String phoneNumber;
    private String role; // "TEACHER" or "STUDENT"
    private String grade; // For students: "9", "10", etc.
    private String linkedinUrl; // For teachers
}