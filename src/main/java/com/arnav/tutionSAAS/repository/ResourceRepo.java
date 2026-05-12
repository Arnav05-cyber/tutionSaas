package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.Resource;
import com.arnav.tutionSAAS.entity.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepo extends JpaRepository<Resource, Long> {

    List<Resource> findByBatch_IdOrderByUploadedAtDesc(Long batchId);

    List<Resource> findByBatch_IdAndType(Long batchId, ResourceType type);
}
