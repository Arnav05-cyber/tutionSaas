package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchRepo extends JpaRepository<Batch, Long> {

    List<Batch> findByTeacher_Id(Long teacherId);

    List<Batch> findByStudents_Id(Long studentId);

    List<Batch> findByGrade(String grade);

    List<Batch> findByIsActiveTrue();
}
