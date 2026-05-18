package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.util.List;

@Data
public class FeeStatusResponse {
    private Long studentId;
    private String studentName;
    private String email;
    private String grade;
    private String studentPhone;
    private String parentEmail;
    private String parentPhone;
    private boolean feesPaid;
    private boolean blocked;
    private List<String> batchNames;
}
