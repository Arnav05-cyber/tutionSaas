package com.arnav.tutionSAAS.dto;

import lombok.Data;

@Data
public class ResourceUploadRequest {
    private String title;
    private String description;
    private String type; // "NOTES", "WPP", "TEST"
}
