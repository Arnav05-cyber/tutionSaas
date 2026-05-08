package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ClassSessionRequest {
    private String title;           // e.g. "Hamlet Act 3 Discussion"
    private LocalDateTime scheduledAt;
    private int durationMinutes;    // defaults to 60 in service if 0
    private String googleMeetLink;
}
