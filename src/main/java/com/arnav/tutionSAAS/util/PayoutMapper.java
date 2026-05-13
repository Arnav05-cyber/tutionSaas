package com.arnav.tutionSAAS.util;

import com.arnav.tutionSAAS.dto.PayoutResponse;
import com.arnav.tutionSAAS.entity.PayoutRecord;
import org.springframework.stereotype.Component;

@Component
public class PayoutMapper {

    public PayoutResponse toPayoutResponse(PayoutRecord record) {
        PayoutResponse response = new PayoutResponse();
        response.setId(record.getId());
        response.setTeacherName(record.getTeacher().getFullName());
        response.setTeacherId(record.getTeacher().getId());
        response.setMonth(record.getMonth());
        response.setClassesCompleted(record.getClassesCompleted());
        response.setRatePerClass(record.getRatePerClass());
        response.setTotalAmount(record.getTotalAmount());
        response.setStatus(record.getStatus().name());
        response.setPaidAt(record.getPaidAt());
        return response;
    }
}
