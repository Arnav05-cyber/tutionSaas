package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepo extends JpaRepository<TeacherProfile, Long> {
}
