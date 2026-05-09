package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.ClassSession;
import com.arnav.tutionSAAS.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClassSessionRepo extends JpaRepository<ClassSession, Long> {

    List<ClassSession> findByBatch_IdOrderByScheduledAtDesc(Long batchId);

    List<ClassSession> findByBatch_IdAndStatus(Long batchId, SessionStatus status);

    // For the email reminder scheduler: find sessions starting soon that haven't been notified
    List<ClassSession> findByScheduledAtBetweenAndReminderSentFalseAndStatus(
        LocalDateTime from, LocalDateTime to, SessionStatus status
    );

    // For payout calculation: count completed sessions for a teacher in a given month
    List<ClassSession> findByBatch_Teacher_IdAndStatusAndScheduledAtBetween(
        Long teacherId, SessionStatus status, LocalDateTime from, LocalDateTime to
    );

    // Upcoming sessions for batches a student is in
    List<ClassSession> findByBatch_IdInAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
        List<Long> batchIds, SessionStatus status, LocalDateTime after
    );
}
