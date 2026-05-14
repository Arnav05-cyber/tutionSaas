package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepo extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByParentLinkCode(String parentLinkCode);
}
