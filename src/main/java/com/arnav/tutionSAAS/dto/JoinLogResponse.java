package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class JoinLogResponse {
    private Long studentId;
    private String studentName;
    private LocalDateTime joinedAt;
}
