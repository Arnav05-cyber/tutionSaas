package com.arnav.tutionSAAS.util;

import com.arnav.tutionSAAS.dto.AttendanceRequest;
import com.arnav.tutionSAAS.dto.AttendanceResponse;
import com.arnav.tutionSAAS.entity.AttendanceRecord;
import com.arnav.tutionSAAS.entity.ClassSession;
import com.arnav.tutionSAAS.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class AttendanceMapper {

    public AttendanceRecord toAttendanceRecord(ClassSession session, User student, boolean present) {
        AttendanceRecord record = new AttendanceRecord();
        record.setSession(session);
        record.setStudent(student);
        record.setPresent(present);
        record.setMarkedAt(LocalDateTime.now());
        return record;
    }

    public AttendanceResponse toAttendanceResponse(ClassSession session, List<AttendanceRecord> records) {
        AttendanceResponse response = new AttendanceResponse();
        response.setSessionId(session.getId());
        response.setSessionTitle(session.getTitle());
        response.setSessionDate(session.getScheduledAt());
        response.setBatchName(session.getBatch().getName());

        response.setRecords(
            records.stream().map(record -> {
                AttendanceResponse.StudentAttendance sa = new AttendanceResponse.StudentAttendance();
                sa.setStudentId(record.getStudent().getId());
                sa.setStudentName(record.getStudent().getFullName());
                sa.setPresent(record.isPresent());
                sa.setMarkedAt(record.getMarkedAt());
                return sa;
            }).collect(Collectors.toList())
        );

        return response;
    }
}
