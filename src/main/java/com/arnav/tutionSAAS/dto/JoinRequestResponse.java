package com.arnav.tutionSAAS.dto;

import lombok.Data;

@Data
public class JoinRequestResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentGrade;
    private Long batchId;
    private String batchName;
    private String batchGrade;
    private String status;
    private String createdAt;
}
