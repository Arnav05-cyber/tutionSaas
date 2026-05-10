package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.AttendanceRequest;
import com.arnav.tutionSAAS.dto.AttendanceResponse;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.AttendanceRepo;
import com.arnav.tutionSAAS.repository.ClassSessionRepo;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.util.AttendanceMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepo attendanceRepo;

    @Autowired
    private ClassSessionRepo sessionRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private AttendanceMapper attendanceMapper;

    @Transactional
    public AttendanceResponse markAttendance(Long sessionId, AttendanceRequest request, String clerkId) {
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Verify the teacher owns this session's batch
        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (!session.getBatch().getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only mark attendance for your own sessions");
        }

        List<AttendanceRecord> records = new ArrayList<>();
        for (AttendanceRequest.AttendanceEntry entry : request.getEntries()) {
            User student = userRepo.findById(entry.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found: " + entry.getStudentId()));

            AttendanceRecord record = attendanceMapper.toAttendanceRecord(session, student, entry.isPresent());
            records.add(record);
        }

        List<AttendanceRecord> saved = attendanceRepo.saveAll(records);
        return attendanceMapper.toAttendanceResponse(session, saved);
    }

    public AttendanceResponse getAttendanceForSession(Long sessionId) {
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<AttendanceRecord> records = attendanceRepo.findBySession_Id(sessionId);
        return attendanceMapper.toAttendanceResponse(session, records);
    }

    public AttendanceSummary getStudentAttendanceSummary(Long batchId, Long studentId) {
        long total = attendanceRepo.countByStudent_IdAndSession_Batch_Id(studentId, batchId);
        long attended = attendanceRepo.countByStudent_IdAndPresentTrueAndSession_Batch_Id(studentId, batchId);

        AttendanceSummary summary = new AttendanceSummary();
        summary.setTotalSessions(total);
        summary.setAttendedSessions(attended);
        summary.setPercentage(total > 0 ? (double) attended / total * 100.0 : 0.0);
        return summary;
    }

    // Inner class for attendance summary
    @lombok.Data
    public static class AttendanceSummary {
        private long totalSessions;
        private long attendedSessions;
        private double percentage;
    }
}
