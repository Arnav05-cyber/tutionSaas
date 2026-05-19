package com.arnav.tutionSAAS.dto;

import com.arnav.tutionSAAS.entity.QueryStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StudentQueryResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String subject;
    private String message;
    private String response;
    private QueryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
