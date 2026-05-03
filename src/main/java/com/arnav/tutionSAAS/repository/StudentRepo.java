package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepo extends JpaRepository<StudentProfile, Long> {
}
