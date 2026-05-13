package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PayoutResponse {
    private Long id;
    private String teacherName;
    private Long teacherId;
    private String month;
    private int classesCompleted;
    private double ratePerClass;
    private double totalAmount;
    private String status;
    private LocalDateTime paidAt;
}
