package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.util.List;

@Data
public class AttendanceRequest {
    private List<AttendanceEntry> entries;

    @Data
    public static class AttendanceEntry {
        private Long studentId;
        private boolean present;
    }
}
