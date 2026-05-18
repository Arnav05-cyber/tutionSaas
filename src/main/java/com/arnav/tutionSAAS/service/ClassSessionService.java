package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.ClassSessionRequest;
import com.arnav.tutionSAAS.dto.ClassSessionResponse;
import com.arnav.tutionSAAS.dto.JoinLogResponse;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.*;
import com.arnav.tutionSAAS.util.ClassSessionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClassSessionService {

    @Autowired private ClassSessionRepo sessionRepo;
    @Autowired private BatchRepo batchRepo;
    @Autowired private UserRepo userRepo;
    @Autowired private ClassSessionMapper sessionMapper;
    @Autowired private SessionJoinLogRepo joinLogRepo;

    @Transactional
    public ClassSessionResponse createSession(Long batchId, ClassSessionRequest request, String clerkId) {
        if (request.getScheduledAt().isBefore(LocalDateTime.now().minusMinutes(15))) {
            throw new RuntimeException("Cannot schedule a session in the past");
        }
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        validateTeacherOwnsBatch(batch, clerkId);
        ClassSession session = sessionMapper.toSessionEntity(request, batch);
        if ("INTERNAL".equals(session.getPlatform())) {
            session.setInternalRoomId("EDUSHA-Live-" + java.util.UUID.randomUUID().toString());
        }
        ClassSession saved = sessionRepo.save(session);
        return sessionMapper.toSessionResponse(saved);
    }

    @Transactional
    public ClassSessionResponse updateSession(Long sessionId, ClassSessionRequest request, String clerkId) {
        if (request.getScheduledAt() != null && request.getScheduledAt().isBefore(LocalDateTime.now().minusMinutes(15))) {
            throw new RuntimeException("Cannot reschedule a session to the past");
        }
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        validateTeacherOwnsBatch(session.getBatch(), clerkId);
        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new RuntimeException("Can only update scheduled sessions");
        }
        sessionMapper.updateSessionFromDto(session, request);
        ClassSession saved = sessionRepo.save(session);
        return sessionMapper.toSessionResponse(saved);
    }

    @Transactional
    public ClassSessionResponse cancelSession(Long sessionId, String clerkId) {
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        validateTeacherOwnsBatch(session.getBatch(), clerkId);
        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new RuntimeException("Can only cancel scheduled sessions");
        }
        session.setStatus(SessionStatus.CANCELLED);
        return sessionMapper.toSessionResponse(sessionRepo.save(session));
    }

    @Transactional
    public ClassSessionResponse completeSession(Long sessionId, String clerkId) {
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        validateTeacherOwnsBatch(session.getBatch(), clerkId);
        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new RuntimeException("Can only complete scheduled sessions");
        }
        session.setStatus(SessionStatus.COMPLETED);
        return sessionMapper.toSessionResponse(sessionRepo.save(session));
    }

    public List<ClassSessionResponse> getSessionsForBatch(Long batchId) {
        return sessionRepo.findByBatch_IdOrderByScheduledAtDesc(batchId)
                .stream().map(sessionMapper::toSessionResponse).collect(Collectors.toList());
    }

    public ClassSessionResponse getSessionById(Long sessionId) {
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return sessionMapper.toSessionResponse(session);
    }

    public List<ClassSessionResponse> getUpcomingSessionsForStudent(String clerkId) {
        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Long> batchIds = batchRepo.findByStudents_Id(student.getId())
                .stream().map(Batch::getId).collect(Collectors.toList());

        if (batchIds.isEmpty()) return List.of();

        return sessionRepo.findByBatch_IdInAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
                batchIds, SessionStatus.SCHEDULED, LocalDateTime.now()
        ).stream().map(sessionMapper::toSessionResponse).collect(Collectors.toList());
    }

    /**
     * Called when a student clicks "Join Class" on the frontend.
     * Logs the join event and returns the meeting link for the frontend to open.
     */
    @Transactional
    public ClassSessionResponse logStudentJoin(Long sessionId, String clerkId) {
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Verify student is enrolled in this batch
        boolean enrolled = batchRepo.findByStudents_Id(student.getId())
                .stream().anyMatch(b -> b.getId().equals(session.getBatch().getId()));
        if (!enrolled) {
            throw new RuntimeException("You are not enrolled in this batch");
        }

        // Only log once per student per session (idempotent)
        if (!joinLogRepo.existsBySession_IdAndStudent_Id(sessionId, student.getId())) {
            SessionJoinLog log = new SessionJoinLog();
            log.setSession(session);
            log.setStudent(student);
            log.setJoinedAt(LocalDateTime.now());
            joinLogRepo.save(log);
        }

        if ("EXTERNAL".equals(session.getPlatform()) && (session.getGoogleMeetLink() == null || session.getGoogleMeetLink().isBlank())) {
            throw new RuntimeException("No meeting link has been set for this session yet");
        }

        return sessionMapper.toSessionResponse(session);
    }

    /**
     * Teacher/admin views who clicked "Join" for a session.
     */
    public List<JoinLogResponse> getJoinLogs(Long sessionId, String clerkId) {
        ClassSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        validateTeacherOwnsBatch(session.getBatch(), clerkId);

        return joinLogRepo.findBySession_Id(sessionId).stream()
                .map(log -> {
                    JoinLogResponse dto = new JoinLogResponse();
                    dto.setStudentId(log.getStudent().getId());
                    dto.setStudentName(log.getStudent().getFullName());
                    dto.setJoinedAt(log.getJoinedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private void validateTeacherOwnsBatch(Batch batch, String clerkId) {
        User user = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (batch.getTeacher() == null || !batch.getTeacher().getId().equals(user.getId())) {
            throw new RuntimeException("You can only manage sessions for your own batches");
        }
    }
}
