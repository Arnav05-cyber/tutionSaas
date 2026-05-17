package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.LinkedStudentResponse;
import com.arnav.tutionSAAS.dto.ParentLinkRequest;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.service.AttendanceService;
import com.arnav.tutionSAAS.service.ParentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parent")
@PreAuthorize("hasRole('PARENT')")
public class ParentController {

    @Autowired private ParentService parentService;

    /**
     * Parent uses the 6-char code from their child to link accounts.
     */
    @PostMapping("/link")
    public ResponseEntity<Void> linkToStudent(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ParentLinkRequest request) {
        parentService.linkToStudent(jwt.getSubject(), request.getLinkCode());
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns all students linked to this parent with fee and blocked status.
     */
    @GetMapping("/students")
    public ResponseEntity<List<LinkedStudentResponse>> getLinkedStudents(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(parentService.getLinkedStudents(jwt.getSubject()));
    }

    /**
     * Returns attendance summary for a linked student in a specific batch.
     */
    @GetMapping("/students/{studentId}/attendance")
    public ResponseEntity<AttendanceService.AttendanceSummary> getStudentAttendance(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId,
            @RequestParam Long batchId) {
        return ResponseEntity.ok(parentService.getStudentAttendance(jwt.getSubject(), studentId, batchId));
    }

    /**
     * Returns fee status for a linked student.
     */
    @GetMapping("/students/{studentId}/fees")
    public ResponseEntity<Map<String, Object>> getStudentFeeStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(parentService.getStudentFeeStatus(jwt.getSubject(), studentId));
    }
    
    @Autowired private com.arnav.tutionSAAS.service.RazorpayService razorpayService;
    @Autowired private com.arnav.tutionSAAS.repository.UserRepo userRepo;
    @Autowired private com.arnav.tutionSAAS.repository.BatchRepo batchRepo;

    @PostMapping("/students/{studentId}/fees/order")
    public ResponseEntity<Map<String, Object>> createOrder(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId) {
        
        parentService.getStudentFeeStatus(jwt.getSubject(), studentId); // Asserts link
        
        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<com.arnav.tutionSAAS.entity.Batch> batches = batchRepo.findByStudents_Id(studentId);
        double totalFee = batches.stream().mapToDouble(com.arnav.tutionSAAS.entity.Batch::getMonthlyFee).sum();
        
        if (totalFee <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "No fees due"));
        }

        String orderId = razorpayService.createOrder(totalFee, student);

        return ResponseEntity.ok(Map.of(
            "orderId", orderId,
            "amount", totalFee,
            "currency", "INR"
        ));
    }

    @PostMapping("/students/{studentId}/fees/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId,
            @RequestBody Map<String, String> payload) {
        
        parentService.getStudentFeeStatus(jwt.getSubject(), studentId); // Asserts link
        
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
    
    @GetMapping("/students/{studentId}/batches")
    public ResponseEntity<List<com.arnav.tutionSAAS.dto.BatchResponse>> getStudentBatches(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(parentService.getStudentBatches(jwt.getSubject(), studentId));
    }

    @GetMapping("/students/{studentId}/sessions")
    public ResponseEntity<List<com.arnav.tutionSAAS.dto.ClassSessionResponse>> getStudentSessions(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(parentService.getStudentSessions(jwt.getSubject(), studentId));
    }
}
