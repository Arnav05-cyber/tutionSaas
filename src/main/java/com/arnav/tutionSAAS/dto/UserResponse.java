package com.arnav.tutionSAAS.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String clerkId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String role;
    private String grade;
    private boolean blocked;
    private boolean onboardingComplete;
}
