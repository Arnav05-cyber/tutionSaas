package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.BatchRequest;
import com.arnav.tutionSAAS.dto.BatchResponse;
import com.arnav.tutionSAAS.entity.Batch;
import com.arnav.tutionSAAS.entity.Resource;
import com.arnav.tutionSAAS.entity.Role;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.BatchRepo;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.dto.JoinRequestResponse;
import com.arnav.tutionSAAS.entity.BatchJoinRequest;
import com.arnav.tutionSAAS.repository.BatchJoinRequestRepo;
import com.arnav.tutionSAAS.repository.AttendanceRepo;
import com.arnav.tutionSAAS.repository.SessionJoinLogRepo;
import com.arnav.tutionSAAS.repository.ClassSessionRepo;
import com.arnav.tutionSAAS.repository.ResourceRepo;
import com.arnav.tutionSAAS.repository.ScheduleSlotRepo;
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
    private BatchJoinRequestRepo batchJoinRequestRepo;

    @Autowired
    private BatchMapper batchMapper;

    @Autowired
    private AttendanceRepo attendanceRepo;

    @Autowired
    private SessionJoinLogRepo sessionJoinLogRepo;

    @Autowired
    private ClassSessionRepo classSessionRepo;

    @Autowired
    private ResourceRepo resourceRepo;

    @Autowired
    private ScheduleSlotRepo scheduleSlotRepo;

    @Autowired
    private StorageService storageService;

    /**
     * Admin creates a batch and assigns a teacher by ID.
     */
    @Transactional
    public BatchResponse createBatch(BatchRequest request) {
        User teacher = userRepo.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("Assigned user is not a teacher");
        }

        Batch batch = batchMapper.toBatchEntity(request, teacher);
        Batch saved = batchRepo.save(batch);
        return batchMapper.toBatchResponse(saved);
    }

    /**
     * Admin assigns a teacher to an existing batch.
     */
    @Transactional
    public BatchResponse assignTeacher(Long batchId, Long teacherId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        User teacher = userRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("Assigned user is not a teacher");
        }

        batch.setTeacher(teacher);
        Batch saved = batchRepo.save(batch);
        return batchMapper.toBatchResponse(saved);
    }

    /**
     * Admin adds a student to a batch.
     */
    @Transactional
    public BatchResponse addStudentToBatch(Long batchId, Long studentId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Can only add students to batches");
        }

        batch.getStudents().add(student);
        Batch saved = batchRepo.save(batch);
        return batchMapper.toBatchResponse(saved);
    }

    /**
     * Admin removes a student from a batch.
     */
    @Transactional
    public BatchResponse removeStudentFromBatch(Long batchId, Long studentId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

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

    // ─── JOIN REQUEST METHODS ───

    public List<BatchResponse> getAvailableBatchesForStudent(String clerkId) {
        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getGrade() == null || student.getGrade().isEmpty()) {
            return List.of();
        }

        List<Batch> activeBatches = batchRepo.findByIsActiveTrue();
        return activeBatches.stream()
                .filter(b -> b.getGrade().equals(student.getGrade()))
                .filter(b -> !b.getStudents().contains(student))
                .filter(b -> batchJoinRequestRepo.findByStudent_IdAndBatch_IdAndStatus(student.getId(), b.getId(), "PENDING").isEmpty())
                .map(batchMapper::toBatchResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void requestJoinBatch(String clerkId, Long batchId) {
        User student = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        if (batch.getStudents().contains(student)) {
            throw new RuntimeException("Already enrolled in this batch");
        }

        if (batchJoinRequestRepo.findByStudent_IdAndBatch_IdAndStatus(student.getId(), batchId, "PENDING").isPresent()) {
            throw new RuntimeException("Join request already pending");
        }

        BatchJoinRequest request = new BatchJoinRequest();
        request.setStudent(student);
        request.setBatch(batch);
        batchJoinRequestRepo.save(request);
    }

    public List<JoinRequestResponse> getPendingJoinRequests() {
        return batchJoinRequestRepo.findByStatus("PENDING").stream()
                .map(req -> {
                    JoinRequestResponse res = new JoinRequestResponse();
                    res.setId(req.getId());
                    res.setStudentId(req.getStudent().getId());
                    res.setStudentName(req.getStudent().getFullName() != null ? req.getStudent().getFullName() : req.getStudent().getEmail());
                    res.setStudentGrade(req.getStudent().getGrade());
                    res.setBatchId(req.getBatch().getId());
                    res.setBatchName(req.getBatch().getName());
                    res.setBatchGrade(req.getBatch().getGrade());
                    res.setStatus(req.getStatus());
                    res.setCreatedAt(req.getCreatedAt().toString());
                    return res;
                }).collect(Collectors.toList());
    }

    @Transactional
    public void approveJoinRequest(Long requestId) {
        BatchJoinRequest request = batchJoinRequestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        request.setStatus("APPROVED");
        batchJoinRequestRepo.save(request);
        
        addStudentToBatch(request.getBatch().getId(), request.getStudent().getId());
    }

    @Transactional
    public void rejectJoinRequest(Long requestId) {
        BatchJoinRequest request = batchJoinRequestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        request.setStatus("REJECTED");
        batchJoinRequestRepo.save(request);
    }

    // ─── BATCH DELETION ───

    /**
     * Admin deletes a batch and ALL associated data.
     *
     * Deletion order (FK-safe):
     * 1. Attendance records for sessions in this batch
     * 2. Session join logs for sessions in this batch
     * 3. Class sessions belonging to this batch
     * 4. Batch join requests for this batch
     * 5. Resources in this batch (also delete storage files)
     * 6. Schedule slots (handled by cascade, but explicit for safety)
     * 7. Clear batch_students join table
     * 8. The batch itself
     */
    @Transactional
    public void deleteBatch(Long batchId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        System.out.println("Deleting batch " + batchId + " (" + batch.getName() + ")");

        // 1. Delete attendance records for all sessions in this batch
        attendanceRepo.deleteBySession_Batch_Id(batchId);

        // 2. Delete session join logs for all sessions in this batch
        sessionJoinLogRepo.deleteBySession_Batch_Id(batchId);

        // 3. Delete class sessions
        classSessionRepo.deleteByBatch_Id(batchId);

        // 4. Delete batch join requests
        batchJoinRequestRepo.deleteByBatch_Id(batchId);

        // 5. Delete resources (with storage cleanup)
        List<Resource> resources = resourceRepo.findByBatch_Id(batchId);
        for (Resource r : resources) {
            try {
                storageService.delete(r.getStorageKey());
            } catch (Exception e) {
                System.err.println("Failed to delete storage file: " + r.getStorageKey() + " — " + e.getMessage());
            }
        }
        resourceRepo.deleteAll(resources);

        // 6. Schedule slots are cascade-deleted via Batch entity,
        //    but clear them explicitly to be safe
        scheduleSlotRepo.deleteAll(scheduleSlotRepo.findByBatch_Id(batchId));

        // 7. Clear student associations
        batch.getStudents().clear();
        batchRepo.save(batch);

        // 8. Delete the batch
        batchRepo.delete(batch);
        System.out.println("Batch " + batchId + " deleted successfully");
    }
}
