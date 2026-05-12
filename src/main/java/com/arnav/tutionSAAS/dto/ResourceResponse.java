package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ResourceResponse {
    private Long id;
    private String title;
    private String description;
    private String type;
    private String fileName;
    private long fileSizeBytes;
    private String downloadUrl;
    private LocalDateTime uploadedAt;
    private String batchName;
    private String teacherName;
}
