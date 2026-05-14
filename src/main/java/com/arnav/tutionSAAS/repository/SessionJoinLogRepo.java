package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.SessionJoinLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionJoinLogRepo extends JpaRepository<SessionJoinLog, Long> {

    List<SessionJoinLog> findBySession_Id(Long sessionId);

    boolean existsBySession_IdAndStudent_Id(Long sessionId, Long studentId);
}
