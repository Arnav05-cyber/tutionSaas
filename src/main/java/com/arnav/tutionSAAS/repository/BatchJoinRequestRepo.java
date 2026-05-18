package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.BatchJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchJoinRequestRepo extends JpaRepository<BatchJoinRequest, Long> {
    List<BatchJoinRequest> findByStatus(String status);
    Optional<BatchJoinRequest> findByStudent_IdAndBatch_IdAndStatus(Long studentId, Long batchId, String status);
}
