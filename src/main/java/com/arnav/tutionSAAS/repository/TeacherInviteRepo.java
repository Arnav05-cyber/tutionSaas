package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.TeacherInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeacherInviteRepo extends JpaRepository<TeacherInvite, Long> {

    Optional<TeacherInvite> findByTokenAndUsedFalse(String token);
}
