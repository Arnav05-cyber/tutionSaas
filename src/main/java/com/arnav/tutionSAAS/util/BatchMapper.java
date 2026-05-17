package com.arnav.tutionSAAS.util;

import com.arnav.tutionSAAS.dto.BatchRequest;
import com.arnav.tutionSAAS.dto.BatchResponse;
import com.arnav.tutionSAAS.entity.Batch;
import com.arnav.tutionSAAS.entity.ScheduleSlot;
import com.arnav.tutionSAAS.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Component
public class BatchMapper {

    public Batch toBatchEntity(BatchRequest dto, User teacher) {
        Batch batch = new Batch();
        batch.setName(dto.getName());
        batch.setGrade(dto.getGrade());
        batch.setTeacher(teacher);
        batch.setActive(true);
        batch.setCreatedAt(LocalDateTime.now());

        // Map schedule slots
        if (dto.getSchedule() != null) {
            for (BatchRequest.ScheduleSlotEntry slotDto : dto.getSchedule()) {
                ScheduleSlot slot = new ScheduleSlot();
                slot.setBatch(batch);
                slot.setDayOfWeek(slotDto.getDayOfWeek());
                slot.setStartTime(slotDto.getStartTime());
                slot.setDurationMinutes(slotDto.getDurationMinutes() > 0 ? slotDto.getDurationMinutes() : 60);
                batch.getScheduleSlots().add(slot);
            }
        }

        return batch;
    }

    public BatchResponse toBatchResponse(Batch batch) {
        BatchResponse response = new BatchResponse();
        response.setId(batch.getId());
        response.setName(batch.getName());
        response.setGrade(batch.getGrade());
        response.setTeacherId(batch.getTeacher().getId());
        response.setTeacherName(batch.getTeacher().getFullName());
        response.setStudentCount(batch.getStudents().size());
        response.setActive(batch.isActive());
        response.setMonthlyFee(batch.getMonthlyFee());

        response.setSchedule(
            batch.getScheduleSlots().stream().map(slot -> {
                BatchResponse.ScheduleSlotInfo info = new BatchResponse.ScheduleSlotInfo();
                info.setId(slot.getId());
                info.setDayOfWeek(slot.getDayOfWeek());
                info.setStartTime(slot.getStartTime());
                info.setDurationMinutes(slot.getDurationMinutes());
                return info;
            }).collect(Collectors.toList())
        );

        response.setStudents(
            batch.getStudents().stream().map(student -> {
                BatchResponse.StudentInfo info = new BatchResponse.StudentInfo();
                info.setId(student.getId());
                info.setFullName(student.getFullName());
                info.setEmail(student.getEmail());
                info.setGrade(student.getGrade());
                return info;
            }).collect(Collectors.toList())
        );

        return response;
    }
}
