package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.StudentQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentQueryRepo extends JpaRepository<StudentQuery, Long> {
    List<StudentQuery> findByStudent_IdOrderByCreatedAtDesc(Long studentId);
    List<StudentQuery> findAllByOrderByCreatedAtDesc();
}
