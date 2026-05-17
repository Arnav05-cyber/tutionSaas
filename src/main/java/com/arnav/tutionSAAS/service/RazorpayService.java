package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.entity.PaymentHistory;
import com.arnav.tutionSAAS.entity.StudentProfile;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.PaymentHistoryRepo;
import com.arnav.tutionSAAS.repository.StudentRepo;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Autowired
    private PaymentHistoryRepo paymentHistoryRepo;

    @Autowired
    private StudentRepo studentRepo;

    @Transactional
    public String createOrder(Double amountInr, User student) {
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            // Amount needs to be in paise (smallest currency unit)
            int amountInPaise = (int) Math.round(amountInr * 100);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            Order order = client.orders.create(orderRequest);
            String razorpayOrderId = order.get("id");

            PaymentHistory paymentHistory = new PaymentHistory();
            paymentHistory.setStudent(student);
            paymentHistory.setAmount(amountInr);
            paymentHistory.setRazorpayOrderId(razorpayOrderId);
            paymentHistory.setStatus("CREATED");
            paymentHistoryRepo.save(paymentHistory);

            return razorpayOrderId;

        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage(), e);
        }
    }

    @Transactional
    public boolean verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            System.out.println("Verifying payment for order: " + razorpayOrderId);
            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);
            System.out.println("Signature isValid: " + isValid);

            PaymentHistory paymentHistory = paymentHistoryRepo.findByRazorpayOrderId(razorpayOrderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            if (isValid) {
                paymentHistory.setRazorpayPaymentId(razorpayPaymentId);
                paymentHistory.setStatus("SUCCESS");

                StudentProfile studentProfile = studentRepo.findById(paymentHistory.getStudent().getId())
                        .orElseThrow(() -> new RuntimeException("Student profile not found"));
                studentProfile.setFeesPaidForCurrentMonth(true);
                studentRepo.save(studentProfile);

            } else {
                paymentHistory.setStatus("FAILED");
            }
            paymentHistoryRepo.save(paymentHistory);

            return isValid;

        } catch (RazorpayException e) {
            throw new RuntimeException("Signature verification failed: " + e.getMessage(), e);
        }
    }
}
