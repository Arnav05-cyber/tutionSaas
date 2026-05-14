package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.ParentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParentProfileRepo extends JpaRepository<ParentProfile, Long> {

    Optional<ParentProfile> findByUser_ClerkId(String clerkId);
}
