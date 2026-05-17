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
    private Long teacherId;
    private String teacherName;
    private int studentCount;
    private boolean isActive;
    private double monthlyFee;
    private List<ScheduleSlotInfo> schedule;
    private List<StudentInfo> students;

    @Data
    public static class ScheduleSlotInfo {
        private Long id;
        private DayOfWeek dayOfWeek;
        private LocalTime startTime;
        private int durationMinutes;
    }

    @Data
    public static class StudentInfo {
        private Long id;
        private String fullName;
        private String email;
        private String grade;
    }
}
