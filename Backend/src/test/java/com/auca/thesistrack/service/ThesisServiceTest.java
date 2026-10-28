package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.thesis.CreateThesisRequest;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.ThesisStageHistory;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.entity.enums.NotificationType;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.ThesisRepository;
import com.auca.thesistrack.repository.ThesisStageHistoryRepository;
import com.auca.thesistrack.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static com.auca.thesistrack.TestData.thesis;
import static com.auca.thesistrack.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ThesisServiceTest {

    @Mock
    private ThesisRepository thesisRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ThesisStageHistoryRepository stageHistoryRepository;

    @InjectMocks
    private ThesisService thesisService;

    private User student;

    @BeforeEach
    void setUp() {
        student = user(Role.STUDENT, "Aline Ingabire");
    }

    private static HttpStatus statusOf(Throwable e) {
        return ((ApiException) e).getStatus();
    }

    @Test
    void registerThesisRecordsInitialStage() {
        when(thesisRepository.findByStudentId(student.getId())).thenReturn(Optional.empty());
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(thesisRepository.saveAndFlush(any(Thesis.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = thesisService.registerThesis(student.getId(), new CreateThesisRequest("Title", "Desc"));

        assertThat(response.status()).isEqualTo("REGISTERED");
        assertThat(response.stageEnteredAt()).isNotNull();
        ArgumentCaptor<ThesisStageHistory> history = ArgumentCaptor.forClass(ThesisStageHistory.class);
        verify(stageHistoryRepository).save(history.capture());
        assertThat(history.getValue().getStatus()).isEqualTo(ThesisStatus.REGISTERED);
        assertThat(history.getValue().getExitedAt()).isNull();
    }

    @Test
    void registerThesisRejectsSecondThesis() {
        when(thesisRepository.findByStudentId(student.getId()))
                .thenReturn(Optional.of(thesis(student, ThesisStatus.REGISTERED)));

        assertThatThrownBy(() -> thesisService.registerThesis(student.getId(), new CreateThesisRequest("T", null)))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void advanceClosesOpenStageAndOpensNewOne() {
        Thesis thesis = thesis(student, ThesisStatus.REGISTERED);
        ThesisStageHistory open = ThesisStageHistory.builder()
                .thesis(thesis).status(ThesisStatus.REGISTERED).enteredAt(LocalDateTime.now().minusDays(3)).build();
        when(stageHistoryRepository.findByThesisIdAndExitedAtIsNull(thesis.getId())).thenReturn(Optional.of(open));

        thesisService.advanceStatusIfForward(thesis, ThesisStatus.PROTOTYPE_PENDING);

        assertThat(thesis.getStatus()).isEqualTo(ThesisStatus.PROTOTYPE_PENDING);
        assertThat(open.getExitedAt()).isNotNull();
        assertThat(thesis.getStageEnteredAt()).isEqualTo(open.getExitedAt());
        verify(stageHistoryRepository).saveAndFlush(open);

        ArgumentCaptor<ThesisStageHistory> created = ArgumentCaptor.forClass(ThesisStageHistory.class);
        verify(stageHistoryRepository).save(created.capture());
        assertThat(created.getValue().getStatus()).isEqualTo(ThesisStatus.PROTOTYPE_PENDING);
        assertThat(created.getValue().getEnteredAt()).isEqualTo(open.getExitedAt());
    }

    @Test
    void advanceNeverMovesBackwardsOrSideways() {
        Thesis thesis = thesis(student, ThesisStatus.SUPERVISOR_ASSIGNED);

        thesisService.advanceStatusIfForward(thesis, ThesisStatus.PROTOTYPE_PENDING);
        thesisService.advanceStatusIfForward(thesis, ThesisStatus.SUPERVISOR_ASSIGNED);

        assertThat(thesis.getStatus()).isEqualTo(ThesisStatus.SUPERVISOR_ASSIGNED);
        verify(thesisRepository, never()).save(any());
        verify(stageHistoryRepository, never()).save(any());
    }

    @Test
    void assignSupervisorRequiresReviewedPrototype() {
        Thesis thesis = thesis(student, ThesisStatus.PROTOTYPE_PENDING);
        when(thesisRepository.findById(thesis.getId())).thenReturn(Optional.of(thesis));

        assertThatThrownBy(() -> thesisService.assignSupervisor(thesis.getId(), UUID.randomUUID()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("prototype review");
    }

    @Test
    void assignSupervisorRejectsNonSupervisor() {
        Thesis thesis = thesis(student, ThesisStatus.PROTOTYPE_REVIEWED);
        User otherStudent = user(Role.STUDENT, "Not A Supervisor");
        when(thesisRepository.findById(thesis.getId())).thenReturn(Optional.of(thesis));
        when(userRepository.findById(otherStudent.getId())).thenReturn(Optional.of(otherStudent));

        assertThatThrownBy(() -> thesisService.assignSupervisor(thesis.getId(), otherStudent.getId()))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void assignSupervisorAdvancesAndNotifiesBothParties() {
        Thesis thesis = thesis(student, ThesisStatus.PROTOTYPE_REVIEWED);
        User supervisor = user(Role.SUPERVISOR, "Dr Jean Mugisha");
        when(thesisRepository.findById(thesis.getId())).thenReturn(Optional.of(thesis));
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));

        var response = thesisService.assignSupervisor(thesis.getId(), supervisor.getId());

        assertThat(response.status()).isEqualTo("SUPERVISOR_ASSIGNED");
        assertThat(response.supervisorId()).isEqualTo(supervisor.getId());
        assertThat(thesis.getSupervisorAssignedAt()).isNotNull();
        verify(notificationService).notify(eq(student), any(), any(), eq(NotificationType.SUPERVISOR_ASSIGNED));
        verify(notificationService).notify(eq(supervisor), any(), any(), eq(NotificationType.SUPERVISOR_ASSIGNED));
    }
}
