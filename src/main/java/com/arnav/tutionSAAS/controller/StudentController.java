package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.BatchResponse;
import com.arnav.tutionSAAS.entity.Batch;
import com.arnav.tutionSAAS.entity.StudentProfile;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.BatchRepo;
import com.arnav.tutionSAAS.repository.StudentRepo;
import com.arnav.tutionSAAS.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    @Autowired private UserRepo userRepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private BatchRepo batchRepo;

    @GetMapping("/fees")
    public ResponseEntity<Map<String, Object>> getFees(@AuthenticationPrincipal Jwt jwt) {
        User user = userRepo.findByClerkId(jwt.getSubject())
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudentProfile profile = studentRepo.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        List<Batch> batches = batchRepo.findByStudents_Id(user.getId());
        double totalFee = batches.stream().mapToDouble(Batch::getMonthlyFee).sum();

        return ResponseEntity.ok(Map.of(
            "totalMonthlyFee", totalFee,
            "isFeesPaidForCurrentMonth", profile.isFeesPaidForCurrentMonth()
        ));
    }

    @Autowired private com.arnav.tutionSAAS.service.RazorpayService razorpayService;

    @PostMapping("/fees/order")
    public ResponseEntity<Map<String, Object>> createOrder(@AuthenticationPrincipal Jwt jwt) {
        User user = userRepo.findByClerkId(jwt.getSubject())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Batch> batches = batchRepo.findByStudents_Id(user.getId());
        double totalFee = batches.stream().mapToDouble(Batch::getMonthlyFee).sum();
        
        if (totalFee <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "No fees due"));
        }

        String orderId = razorpayService.createOrder(totalFee, user);

        return ResponseEntity.ok(Map.of(
            "orderId", orderId,
            "amount", totalFee,
            "currency", "INR"
        ));
    }

    @PostMapping("/fees/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> payload) {
        
        String razorpayOrderId = payload.get("razorpay_order_id");
        String razorpayPaymentId = payload.get("razorpay_payment_id");
        String razorpaySignature = payload.get("razorpay_signature");

        boolean isValid = razorpayService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment verified successfully"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Payment signature verification failed"
            ));
        }
    }
}
