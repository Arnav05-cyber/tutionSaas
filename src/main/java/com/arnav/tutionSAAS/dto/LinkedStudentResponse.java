package com.arnav.tutionSAAS.dto;

import lombok.Data;

@Data
public class LinkedStudentResponse {
    private Long studentId;
    private String studentName;
    private String email;
    private String grade;
    private boolean feesPaid;
    private boolean blocked;
}
