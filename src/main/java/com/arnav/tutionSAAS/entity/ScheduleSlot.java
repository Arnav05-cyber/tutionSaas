package com.arnav.tutionSAAS.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Represents a recurring class slot in a batch's weekly schedule.
 * e.g. Monday at 16:00, Wednesday at 16:00, Friday at 16:00
 */
@Entity
@Table(name = "schedule_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek; // MONDAY, WEDNESDAY, FRIDAY, etc.

    @Column(nullable = false)
    private LocalTime startTime; // e.g. 16:00

    private int durationMinutes = 60;
}
