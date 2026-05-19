package com.arnav.tutionSAAS.util;

import com.arnav.tutionSAAS.dto.StudentQueryResponse;
import com.arnav.tutionSAAS.entity.StudentQuery;
import org.springframework.stereotype.Component;

@Component
public class StudentQueryMapper {
    public StudentQueryResponse toDto(StudentQuery query) {
        StudentQueryResponse dto = new StudentQueryResponse();
        dto.setId(query.getId());
        dto.setStudentId(query.getStudent().getId());
        dto.setStudentName(query.getStudent().getFullName());
        dto.setSubject(query.getSubject());
        dto.setMessage(query.getMessage());
        dto.setResponse(query.getResponse());
        dto.setStatus(query.getStatus());
        dto.setCreatedAt(query.getCreatedAt());
        dto.setUpdatedAt(query.getUpdatedAt());
        return dto;
    }
}
