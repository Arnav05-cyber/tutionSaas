package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByClerkId(String clerkId);

    List<User> findByRole(Role role);
}
