package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.PayoutRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayoutRepo extends JpaRepository<PayoutRecord, Long> {

    List<PayoutRecord> findByTeacher_Id(Long teacherId);

    List<PayoutRecord> findByMonth(String month);

    Optional<PayoutRecord> findByTeacher_IdAndMonth(Long teacherId, String month);
}
