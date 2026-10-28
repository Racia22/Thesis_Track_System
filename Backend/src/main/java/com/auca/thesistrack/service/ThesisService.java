package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.supervisor.SupervisorSummaryResponse;
import com.auca.thesistrack.dto.thesis.CreateThesisRequest;
import com.auca.thesistrack.dto.thesis.ThesisResponse;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.entity.enums.NotificationType;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.ThesisRepository;
import com.auca.thesistrack.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ThesisService {

    private final ThesisRepository thesisRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ThesisService(ThesisRepository thesisRepository, UserRepository userRepository,
                          NotificationService notificationService) {
        this.thesisRepository = thesisRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public ThesisResponse getMyThesis(UUID studentId) {
        Thesis thesis = thesisRepository.findByStudentId(studentId)
                .orElseThrow(() -> ApiException.notFound("You have not registered a thesis yet"));
        return ThesisResponse.from(thesis);
    }

    @Transactional
    public ThesisResponse registerThesis(UUID studentId, CreateThesisRequest request) {
        if (thesisRepository.findByStudentId(studentId).isPresent()) {
            throw ApiException.conflict("You already have an active thesis");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> ApiException.notFound("Student not found"));

        Thesis thesis = Thesis.builder()
                .student(student)
                .title(request.title())
                .description(request.description())
                .build();

        thesis = thesisRepository.saveAndFlush(thesis);
        return ThesisResponse.from(thesis);
    }

    /**
     * Moves the thesis to {@code target} only if that is a later stage than its current
     * status, per the "status only moves forward" business rule (coordinator override
     * excepted, which goes through a separate manual-update path).
     */
    @Transactional
    public void advanceStatusIfForward(Thesis thesis, ThesisStatus target) {
        if (target.ordinal() > thesis.getStatus().ordinal()) {
            thesis.setStatus(target);
            thesisRepository.save(thesis);
        }
    }

    @Transactional
    public void markPrototypeReviewed(Thesis thesis) {
        if (thesis.getPrototypeReviewedAt() == null) {
            thesis.setPrototypeReviewedAt(LocalDateTime.now());
        }
        advanceStatusIfForward(thesis, ThesisStatus.PROTOTYPE_REVIEWED);
    }

    @Transactional(readOnly = true)
    public List<ThesisResponse> getSupervisedTheses(UUID supervisorId) {
        return thesisRepository.findBySupervisorId(supervisorId)
                .stream()
                .map(ThesisResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ThesisResponse> getSupervisorAssignmentQueue() {
        return thesisRepository.findByStatusOrderByPrototypeReviewedAtAsc(ThesisStatus.PROTOTYPE_REVIEWED)
                .stream()
                .map(ThesisResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupervisorSummaryResponse> getSupervisorsWithWorkload() {
        return userRepository.findByRole(Role.SUPERVISOR).stream()
                .map(supervisor -> SupervisorSummaryResponse.of(
                        supervisor,
                        thesisRepository.countBySupervisorIdAndStatusNot(supervisor.getId(), ThesisStatus.COMPLETED)))
                .toList();
    }

    @Transactional
    public ThesisResponse assignSupervisor(UUID thesisId, UUID supervisorId) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> ApiException.notFound("Thesis not found"));

        if (thesis.getStatus() != ThesisStatus.PROTOTYPE_REVIEWED) {
            throw ApiException.conflict("A supervisor can only be assigned after the prototype review is completed");
        }

        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> ApiException.notFound("Supervisor not found"));

        if (supervisor.getRole() != Role.SUPERVISOR) {
            throw ApiException.badRequest("Selected user is not a supervisor");
        }

        thesis.setSupervisor(supervisor);
        thesis.setSupervisorAssignedAt(LocalDateTime.now());
        advanceStatusIfForward(thesis, ThesisStatus.SUPERVISOR_ASSIGNED);
        thesisRepository.save(thesis);

        notificationService.notify(
                thesis.getStudent(),
                "Supervisor assigned",
                supervisor.getName() + " has been assigned as your thesis supervisor.",
                NotificationType.SUPERVISOR_ASSIGNED
        );
        notificationService.notify(
                supervisor,
                "New student assigned",
                thesis.getStudent().getName() + " (\"" + thesis.getTitle() + "\") has been assigned to you.",
                NotificationType.SUPERVISOR_ASSIGNED
        );

        return ThesisResponse.from(thesis);
    }
}
