package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.BatchRequest;
import com.arnav.tutionSAAS.dto.BatchResponse;
import com.arnav.tutionSAAS.entity.Batch;
import com.arnav.tutionSAAS.entity.Role;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.BatchRepo;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.util.BatchMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BatchService {

    @Autowired
    private BatchRepo batchRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private BatchMapper batchMapper;

    @Transactional
    public BatchResponse createBatch(String clerkId, BatchRequest request) {
        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("Only teachers can create batches");
        }

        if (!teacher.isApproved()) {
            throw new RuntimeException("Teacher must be approved before creating batches");
        }

        Batch batch = batchMapper.toBatchEntity(request, teacher);
        Batch saved = batchRepo.save(batch);
        return batchMapper.toBatchResponse(saved);
    }

    @Transactional
    public BatchResponse addStudentToBatch(Long batchId, Long studentId, String clerkId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        // Verify the requesting user owns this batch
        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (!batch.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only manage your own batches");
        }

        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Can only add students to batches");
        }

        // Validate grade match
        if (!batch.getGrade().equals(student.getGrade())) {
            throw new RuntimeException("Student grade (" + student.getGrade() +
                    ") does not match batch grade (" + batch.getGrade() + ")");
        }

        batch.getStudents().add(student);
        Batch saved = batchRepo.save(batch);
        return batchMapper.toBatchResponse(saved);
    }

    @Transactional
    public BatchResponse removeStudentFromBatch(Long batchId, Long studentId, String clerkId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (!batch.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only manage your own batches");
        }

        batch.getStudents().removeIf(s -> s.getId().equals(studentId));
        Batch saved = batchRepo.save(batch);
        return batchMapper.toBatchResponse(saved);
    }

    public List<BatchResponse> getTeacherBatches(String clerkId) {
        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        return batchRepo.findByTeacher_Id(teacher.getId())
                .stream()
                .map(batchMapper::toBatchResponse)
                .collect(Collectors.toList());
    }

    public List<BatchResponse> getStudentBatches(String clerkId) {
        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return batchRepo.findByStudents_Id(student.getId())
                .stream()
                .map(batchMapper::toBatchResponse)
                .collect(Collectors.toList());
    }

    public BatchResponse getBatchById(Long batchId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        return batchMapper.toBatchResponse(batch);
    }

    public List<BatchResponse> getAllBatches() {
        return batchRepo.findByIsActiveTrue()
                .stream()
                .map(batchMapper::toBatchResponse)
                .collect(Collectors.toList());
    }
}
