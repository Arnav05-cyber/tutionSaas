package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.ScheduleSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleSlotRepo extends JpaRepository<ScheduleSlot, Long> {

    List<ScheduleSlot> findByBatch_Id(Long batchId);
}
