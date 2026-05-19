package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.QueryReplyRequest;
import com.arnav.tutionSAAS.dto.StudentQueryRequest;
import com.arnav.tutionSAAS.dto.StudentQueryResponse;
import com.arnav.tutionSAAS.entity.QueryStatus;
import com.arnav.tutionSAAS.entity.StudentQuery;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.StudentQueryRepo;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.util.StudentQueryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentQueryService {

    @Autowired private StudentQueryRepo queryRepo;
    @Autowired private UserRepo userRepo;
    @Autowired private StudentQueryMapper queryMapper;

    @Transactional
    public StudentQueryResponse createQuery(StudentQueryRequest request, String clerkId) {
        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        StudentQuery query = new StudentQuery();
        query.setStudent(student);
        query.setSubject(request.getSubject());
        query.setMessage(request.getMessage());
        query.setStatus(QueryStatus.OPEN);
        
        StudentQuery saved = queryRepo.save(query);
        return queryMapper.toDto(saved);
    }

    public List<StudentQueryResponse> getMyQueries(String clerkId) {
        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
                
        return queryRepo.findByStudent_IdOrderByCreatedAtDesc(student.getId())
                .stream()
                .map(queryMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<StudentQueryResponse> getAllQueries() {
        return queryRepo.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(queryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentQueryResponse replyToQuery(Long queryId, QueryReplyRequest request) {
        StudentQuery query = queryRepo.findById(queryId)
                .orElseThrow(() -> new RuntimeException("Query not found"));
                
        query.setResponse(request.getResponse());
        query.setStatus(QueryStatus.RESOLVED);
        
        StudentQuery saved = queryRepo.save(query);
        return queryMapper.toDto(saved);
    }
}
