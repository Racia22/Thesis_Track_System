package com.auca.thesistrack.service;

import com.auca.thesistrack.entity.Booking;
import com.auca.thesistrack.entity.ReviewSlot;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.entity.enums.BookingStatus;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.BookingRepository;
import com.auca.thesistrack.repository.ReviewSlotRepository;
import com.auca.thesistrack.repository.ThesisRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static com.auca.thesistrack.TestData.slot;
import static com.auca.thesistrack.TestData.thesis;
import static com.auca.thesistrack.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ReviewSlotRepository reviewSlotRepository;
    @Mock
    private ThesisRepository thesisRepository;
    @Mock
    private ThesisService thesisService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    private User student;
    private Thesis thesis;

    @BeforeEach
    void setUp() {
        student = user(Role.STUDENT, "Eric Bizimana");
        thesis = thesis(student, ThesisStatus.REGISTERED);
    }

    private static HttpStatus statusOf(Throwable e) {
        return ((ApiException) e).getStatus();
    }

    private void givenNoActiveBookingAnd(ReviewSlot slot) {
        when(thesisRepository.findByStudentId(student.getId())).thenReturn(Optional.of(thesis));
        when(bookingRepository.findByThesisIdAndStatus(thesis.getId(), BookingStatus.BOOKED)).thenReturn(Optional.empty());
        when(reviewSlotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));
    }

    @Test
    void bookingASlotIncrementsCountAndAdvancesThesis() {
        ReviewSlot slot = slot(LocalDate.now().plusDays(3), 2, 0);
        givenNoActiveBookingAnd(slot);
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = bookingService.createBooking(student.getId(), slot.getId());

        assertThat(response.status()).isEqualTo("BOOKED");
        assertThat(slot.getBookedCount()).isEqualTo(1);
        verify(thesisService).advanceStatusIfForward(thesis, ThesisStatus.PROTOTYPE_PENDING);
    }

    @Test
    void cannotBookAFullSlot() {
        ReviewSlot slot = slot(LocalDate.now().plusDays(3), 1, 1);
        givenNoActiveBookingAnd(slot);

        assertThatThrownBy(() -> bookingService.createBooking(student.getId(), slot.getId()))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("full");
        verify(bookingRepository, never()).saveAndFlush(any());
    }

    @Test
    void cannotBookAPastSlot() {
        ReviewSlot slot = slot(LocalDate.now().minusDays(1), 1, 0);
        givenNoActiveBookingAnd(slot);

        assertThatThrownBy(() -> bookingService.createBooking(student.getId(), slot.getId()))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void cannotHoldTwoActiveBookings() {
        Booking existing = Booking.builder().thesis(thesis).slot(slot(LocalDate.now().plusDays(1), 1, 1)).build();
        when(thesisRepository.findByStudentId(student.getId())).thenReturn(Optional.of(thesis));
        when(bookingRepository.findByThesisIdAndStatus(thesis.getId(), BookingStatus.BOOKED))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> bookingService.createBooking(student.getId(), UUID.randomUUID()))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void cancellingFreesTheSpot() {
        ReviewSlot slot = slot(LocalDate.now().plusDays(1), 2, 2);
        Booking booking = Booking.builder().id(UUID.randomUUID()).thesis(thesis).slot(slot).build();
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);

        bookingService.cancelBooking(booking.getId(), student.getId(), false);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(slot.getBookedCount()).isEqualTo(1);
    }

    @Test
    void studentCannotCancelAnotherStudentsBooking() {
        Booking booking = Booking.builder().id(UUID.randomUUID()).thesis(thesis)
                .slot(slot(LocalDate.now().plusDays(1), 1, 1)).build();
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking(booking.getId(), UUID.randomUUID(), false))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.BOOKED);
    }

    @Test
    void completingMarksPrototypeReviewed() {
        Booking booking = Booking.builder().id(UUID.randomUUID()).thesis(thesis)
                .slot(slot(LocalDate.now(), 1, 1)).build();
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);

        bookingService.completeBooking(booking.getId(), "Looks good");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.COMPLETED);
        assertThat(booking.getCompletedAt()).isNotNull();
        verify(thesisService).markPrototypeReviewed(thesis);
    }
}
