package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AttendanceResponse {
    private Long sessionId;
    private String sessionTitle;
    private LocalDateTime sessionDate;
    private String batchName;
    private List<StudentAttendance> records;

    @Data
    public static class StudentAttendance {
        private Long studentId;
        private String studentName;
        private boolean present;
        private LocalDateTime markedAt;
    }
}
