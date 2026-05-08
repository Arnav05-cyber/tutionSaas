package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Data
public class BatchResponse {
    private Long id;
    private String name;
    private String grade;
    private String teacherName;
    private int studentCount;
    private boolean isActive;
    private List<ScheduleSlotInfo> schedule;

    @Data
    public static class ScheduleSlotInfo {
        private Long id;
        private DayOfWeek dayOfWeek;
        private LocalTime startTime;
        private int durationMinutes;
    }
}
