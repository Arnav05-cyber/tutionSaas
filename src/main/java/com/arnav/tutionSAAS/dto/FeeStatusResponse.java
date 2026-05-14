package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.util.List;

@Data
public class FeeStatusResponse {
    private Long studentId;
    private String studentName;
    private String email;
    private String grade;
    private boolean feesPaid;
    private boolean blocked;
    private List<String> batchNames;
}
