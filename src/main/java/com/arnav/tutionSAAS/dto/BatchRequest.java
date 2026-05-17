package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Data
public class BatchRequest {
    private String name;       // e.g. "Grade 10 - Batch A"
    private String grade;      // "9", "10", "11", "12"
    private Long teacherId;    // Admin assigns a teacher
    private List<ScheduleSlotEntry> schedule; // Recurring weekly slots

    @Data
    public static class ScheduleSlotEntry {
        private DayOfWeek dayOfWeek; // MONDAY, WEDNESDAY, FRIDAY
        private LocalTime startTime; // e.g. "16:00"
        private int durationMinutes; // default 60
    }
}
