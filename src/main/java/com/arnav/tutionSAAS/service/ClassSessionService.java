package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.ClassSessionRequest;
import com.arnav.tutionSAAS.dto.ClassSessionResponse;
import com.arnav.tutionSAAS.entity.Batch;
import com.arnav.tutionSAAS.entity.ClassSession;
import com.arnav.tutionSAAS.entity.SessionStatus;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.BatchRepo;
import com.arnav.tutionSAAS.repository.ClassSessionRepo;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.util.ClassSessionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClassSessionService {

    @Autowired
    private ClassSessionRepo sessionRepo;

    @Autowired
    private BatchRepo batchRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ClassSessionMapper sessionMapper;

    @Transactional
    public ClassSessionResponse createSession(Long batchId, ClassSessionRequest request, String clerkId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        validateTeacherOwnsBatch(batch, clerkId);

        ClassSession session = sessionMapper.toSessionEntity(request, batch);
        ClassSession saved = sessionRepo.save(session);
        return sessionMapper.toSessionResponse(saved);
    }

    @Transactional
    public ClassSessionResponse updateSession(Long sessionId, ClassSessionRequest request, String clerkId) {
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
        ClassSession saved = sessionRepo.save(session);
        return sessionMapper.toSessionResponse(saved);
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
        ClassSession saved = sessionRepo.save(session);
        return sessionMapper.toSessionResponse(saved);
    }

    public List<ClassSessionResponse> getSessionsForBatch(Long batchId) {
        return sessionRepo.findByBatch_IdOrderByScheduledAtDesc(batchId)
                .stream()
                .map(sessionMapper::toSessionResponse)
                .collect(Collectors.toList());
    }

    public List<ClassSessionResponse> getUpcomingSessionsForStudent(String clerkId) {
        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Get all batch IDs the student is enrolled in
        List<Long> batchIds = batchRepo.findByStudents_Id(student.getId())
                .stream()
                .map(Batch::getId)
                .collect(Collectors.toList());

        if (batchIds.isEmpty()) {
            return List.of();
        }

        return sessionRepo.findByBatch_IdInAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
                batchIds, SessionStatus.SCHEDULED, LocalDateTime.now()
        ).stream()
                .map(sessionMapper::toSessionResponse)
                .collect(Collectors.toList());
    }

    private void validateTeacherOwnsBatch(Batch batch, String clerkId) {
        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (!batch.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only manage sessions for your own batches");
        }
    }
}
