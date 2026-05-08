package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ClassSessionResponse {
    private Long id;
    private String title;
    private LocalDateTime scheduledAt;
    private int durationMinutes;
    private String googleMeetLink;
    private String status;
    private String batchName;
    private Long batchId;
}
