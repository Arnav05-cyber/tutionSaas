package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRepo extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findBySession_Id(Long sessionId);

    // Student's attendance history within a batch
    List<AttendanceRecord> findByStudent_IdAndSession_Batch_Id(Long studentId, Long batchId);

    // Count classes attended for attendance percentage
    long countByStudent_IdAndPresentTrueAndSession_Batch_Id(Long studentId, Long batchId);

    // Total sessions a student was marked in for a batch
    long countByStudent_IdAndSession_Batch_Id(Long studentId, Long batchId);
}
