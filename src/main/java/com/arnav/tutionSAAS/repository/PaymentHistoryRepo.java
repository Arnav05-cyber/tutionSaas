package com.arnav.tutionSAAS.repository;

import com.arnav.tutionSAAS.entity.PaymentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentHistoryRepo extends JpaRepository<PaymentHistory, Long> {
    Optional<PaymentHistory> findByRazorpayOrderId(String razorpayOrderId);
}
