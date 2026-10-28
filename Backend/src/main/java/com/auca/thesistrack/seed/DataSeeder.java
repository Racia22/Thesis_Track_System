package com.auca.thesistrack.seed;

import com.auca.thesistrack.entity.Booking;
import com.auca.thesistrack.entity.Message;
import com.auca.thesistrack.entity.Notification;
import com.auca.thesistrack.entity.ReviewSlot;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.entity.enums.BookingStatus;
import com.auca.thesistrack.entity.enums.NotificationType;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.repository.BookingRepository;
import com.auca.thesistrack.repository.MessageRepository;
import com.auca.thesistrack.repository.NotificationRepository;
import com.auca.thesistrack.repository.ReviewSlotRepository;
import com.auca.thesistrack.repository.ThesisRepository;
import com.auca.thesistrack.repository.UserRepository;
import com.auca.thesistrack.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Populates the database with a realistic demo dataset (per the project brief's "Seed Data
 * to Generate" section) for local development and demos. Disabled unless
 * {@code app.seed.enabled=true}; with {@code app.seed.reset=true} it truncates all
 * application tables first for a clean, repeatable dataset instead of skipping when data
 * already exists.
 *
 * <p>Entities are created through JPA/repositories so relationships and business rules stay
 * correct, then a final JDBC pass backdates the {@code @CreationTimestamp}/{@code @UpdateTimestamp}
 * columns (registered_at, sent_at, booked_at, etc.) to realistic historical values — Hibernate
 * always overwrites those to "now" on insert/update, so there's no way to set them through the
 * entities themselves.
 */
@Component
@Order(Integer.MAX_VALUE)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ThesisRepository thesisRepository;
    private final ReviewSlotRepository reviewSlotRepository;
    private final BookingRepository bookingRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${app.seed.reset:false}")
    private boolean seedReset;

    private LocalDateTime now;

    public DataSeeder(UserRepository userRepository,
                       ThesisRepository thesisRepository,
                       ReviewSlotRepository reviewSlotRepository,
                       BookingRepository bookingRepository,
                       MessageRepository messageRepository,
                       NotificationRepository notificationRepository,
                       NotificationService notificationService,
                       PasswordEncoder passwordEncoder,
                       JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.thesisRepository = thesisRepository;
        this.reviewSlotRepository = reviewSlotRepository;
        this.bookingRepository = bookingRepository;
        this.messageRepository = messageRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        if (seedReset) {
            log.info("app.seed.reset=true — truncating all application tables before seeding");
            jdbcTemplate.execute(
                    "TRUNCATE TABLE notifications, feedback, thesis_documents, messages, bookings, " +
                            "review_slots, theses, users RESTART IDENTITY CASCADE");
        } else if (userRepository.count() > 0) {
            log.info("Seed data skipped: users table is not empty (set app.seed.reset=true to force a clean reseed)");
            return;
        }

        this.now = LocalDateTime.now();
        log.info("Seeding demo data...");

        User admin = createUser("Admin Account", "admin@auca.ac.rw", "Admin@1234", Role.ADMIN, null, null);
        User coordinator = createUser("Coordinator Account", "coordinator@auca.ac.rw", "Coord@1234", Role.COORDINATOR, null, null);
        backdateUser(admin.getId(), now.minusDays(200));
        backdateUser(coordinator.getId(), now.minusDays(200));

        List<User> supervisors = seedSupervisors();
        List<Thesis> theses = seedStudentsAndTheses(supervisors);

        // Index ranges within `theses`, matching the STUDENTS table below.
        List<Thesis> registered = theses.subList(0, 5);
        List<Thesis> prototypePending = theses.subList(5, 9);
        List<Thesis> prototypeReviewed = theses.subList(9, 12);
        List<Thesis> supervisorAssigned = theses.subList(12, 15);
        List<Thesis> inProgress = theses.subList(15, 18);
        List<Thesis> readyForDefense = theses.subList(18, 19);
        List<Thesis> completed = theses.subList(19, 20);

        List<ReviewSlot> pastSlots = seedPastSlots(coordinator);
        seedPastBookings(pastSlots, registered, prototypeReviewed, supervisorAssigned, inProgress, readyForDefense, completed);

        List<ReviewSlot> upcomingSlots = seedUpcomingSlots(coordinator);
        seedUpcomingBookings(upcomingSlots, prototypePending);

        List<Thesis> supervisedTheses = new ArrayList<>();
        supervisedTheses.addAll(supervisorAssigned);
        supervisedTheses.addAll(inProgress);
        supervisedTheses.addAll(readyForDefense);
        supervisedTheses.addAll(completed);
        seedMessages(supervisedTheses);

        log.info("Seed data complete: {} users, {} theses, {} slots, {} bookings, {} messages, {} notifications",
                userRepository.count(), thesisRepository.count(), reviewSlotRepository.count(),
                bookingRepository.count(), messageRepository.count(), notificationRepository.count());
    }

    // ---------------------------------------------------------------- users

    private List<User> seedSupervisors() {
        record SupervisorSeed(String name, String email, String department) {
        }

        List<SupervisorSeed> seeds = List.of(
                new SupervisorSeed("Dr. Jean Mugisha", "supervisor1@auca.ac.rw", "Computer Science"),
                new SupervisorSeed("Dr. Marie Uwimana", "supervisor2@auca.ac.rw", "Information Systems"),
                new SupervisorSeed("Dr. Eric Nshimiyimana", "supervisor3@auca.ac.rw", "Software Engineering"),
                new SupervisorSeed("Dr. Grace Mukamana", "supervisor4@auca.ac.rw", "Computer Science")
        );

        List<User> supervisors = new ArrayList<>();
        for (SupervisorSeed seed : seeds) {
            User supervisor = createUser(seed.name(), seed.email(), "Super@1234", Role.SUPERVISOR, null, seed.department());
            backdateUser(supervisor.getId(), now.minusDays(200));
            supervisors.add(supervisor);
        }
        return supervisors;
    }

    private User createUser(String name, String email, String rawPassword, Role role, String phone, String department) {
        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .phone(phone)
                .department(department)
                .isActive(true)
                .build();
        return userRepository.saveAndFlush(user);
    }

    private void backdateUser(UUID userId, LocalDateTime createdAt) {
        jdbcTemplate.update("UPDATE users SET created_at = ?, updated_at = ? WHERE id = ?",
                ts(createdAt), ts(createdAt), userId);
    }

    // ---------------------------------------------------------------- students + theses

    private record StudentSeed(
            String name, String email, String title, String description, String department,
            long registeredDaysAgo, Long reviewedDaysAgo, Integer supervisorIndex, Long supervisorAssignedDaysAgo,
            Long updatedDaysAgo, Long defenseDaysAgo, boolean defenseInFuture, ThesisStatus status
    ) {
    }

    private List<StudentSeed> studentSeeds() {
        return List.of(
                // Group A — REGISTERED (5): waiting to book a prototype review at all.
                new StudentSeed("Aline Ingabire", "student1@auca.ac.rw", "Mobile Health Records for Rural Clinics",
                        "A mobile app for offline-first patient record keeping.", "Computer Science",
                        2, null, null, null, null, null, false, ThesisStatus.REGISTERED),
                new StudentSeed("Patrick Habimana", "student2@auca.ac.rw", "Smart Irrigation Scheduling System",
                        "IoT soil-moisture sensing with automated irrigation scheduling.", "Software Engineering",
                        5, null, null, null, null, null, false, ThesisStatus.REGISTERED),
                new StudentSeed("Diane Umutoni", "student3@auca.ac.rw", "Voice-based Agricultural Extension Service",
                        "A Kinyarwanda voice assistant for smallholder farmers.", "Computer Science",
                        45, null, null, null, null, null, false, ThesisStatus.REGISTERED),
                new StudentSeed("Emmanuel Nkurunziza", "student4@auca.ac.rw", "Blockchain Land Title Registry",
                        "A prototype land registry using a permissioned blockchain.", "Information Systems",
                        60, null, null, null, null, null, false, ThesisStatus.REGISTERED),
                new StudentSeed("Josiane Uwase", "student5@auca.ac.rw", "Public Transit Route Optimization",
                        "Route optimization for Kigali's public bus network.", "Software Engineering",
                        90, null, null, null, null, null, false, ThesisStatus.REGISTERED),

                // Group B — PROTOTYPE_PENDING (4): booked an upcoming slot, waiting to be reviewed.
                new StudentSeed("Eric Bizimana", "student6@auca.ac.rw", "AI-Assisted Crop Disease Diagnosis",
                        "A CNN-based mobile tool for diagnosing crop disease from photos.", "Computer Science",
                        10, null, null, null, null, null, false, ThesisStatus.PROTOTYPE_PENDING),
                new StudentSeed("Claudine Mukandayisenga", "student7@auca.ac.rw", "University Course Timetabling System",
                        "A constraint-solver based automatic timetable generator.", "Information Systems",
                        15, null, null, null, null, null, false, ThesisStatus.PROTOTYPE_PENDING),
                new StudentSeed("Olivier Ndayisenga", "student8@auca.ac.rw", "Peer-to-Peer Solar Energy Trading Platform",
                        "A marketplace for households to trade excess solar power.", "Software Engineering",
                        20, null, null, null, null, null, false, ThesisStatus.PROTOTYPE_PENDING),
                new StudentSeed("Divine Iradukunda", "student9@auca.ac.rw", "Digital Cooperative Savings Platform",
                        "A savings and loan tracker for village cooperative groups.", "Computer Science",
                        8, null, null, null, null, null, false, ThesisStatus.PROTOTYPE_PENDING),

                // Group C — PROTOTYPE_REVIEWED (3): reviewed, waiting for a supervisor.
                new StudentSeed("Vincent Hakizimana", "student10@auca.ac.rw", "Automated Exam Proctoring System",
                        "Webcam-based anomaly detection for remote exams.", "Computer Science",
                        40, 10L, null, null, null, null, false, ThesisStatus.PROTOTYPE_REVIEWED),
                new StudentSeed("Sandrine Mutesi", "student11@auca.ac.rw", "Hospital Bed Availability Tracker",
                        "Real-time bed availability dashboard across district hospitals.", "Information Systems",
                        35, 6L, null, null, null, null, false, ThesisStatus.PROTOTYPE_REVIEWED),
                new StudentSeed("Fabrice Niyonsenga", "student12@auca.ac.rw", "Waste Collection Route Planner",
                        "GPS-based route optimization for municipal waste trucks.", "Software Engineering",
                        50, 15L, null, null, null, null, false, ThesisStatus.PROTOTYPE_REVIEWED),

                // Group D — SUPERVISOR_ASSIGNED (3): supervisor just assigned.
                new StudentSeed("Aimee Keza", "student13@auca.ac.rw", "E-Prescription Verification System",
                        "A pharmacist-facing tool to verify digital prescriptions.", "Computer Science",
                        60, 30L, 0, 3L, null, null, false, ThesisStatus.SUPERVISOR_ASSIGNED),
                new StudentSeed("Jean de Dieu Ntwari", "student14@auca.ac.rw", "Microfinance Credit Scoring Model",
                        "An alternative credit-scoring model for unbanked applicants.", "Information Systems",
                        55, 25L, 1, 5L, null, null, false, ThesisStatus.SUPERVISOR_ASSIGNED),
                new StudentSeed("Chantal Umuhoza", "student15@auca.ac.rw", "Early Warning Flood Alert System",
                        "SMS-based flood alerts for at-risk river communities.", "Software Engineering",
                        50, 20L, 2, 2L, null, null, false, ThesisStatus.SUPERVISOR_ASSIGNED),

                // Group E — IN_PROGRESS (3): actively working with their supervisor.
                new StudentSeed("Yves Tuyishime", "student16@auca.ac.rw", "Warehouse Inventory Robot Navigation",
                        "Path-planning for a low-cost warehouse inventory robot.", "Computer Science",
                        90, 60L, 3, 45L, 20L, null, false, ThesisStatus.IN_PROGRESS),
                new StudentSeed("Solange Ishimwe", "student17@auca.ac.rw", "Digital Literacy Tutoring Chatbot",
                        "A chatbot tutor for adult digital-literacy learners.", "Information Systems",
                        100, 45L, 0, 35L, 20L, null, false, ThesisStatus.IN_PROGRESS),
                new StudentSeed("Dominique Byiringiro", "student18@auca.ac.rw", "Predictive Maintenance for Water Pumps",
                        "Sensor-based failure prediction for rural water pumps.", "Software Engineering",
                        95, 90L, 1, 40L, 10L, null, false, ThesisStatus.IN_PROGRESS),

                // Group F — READY_FOR_DEFENSE (1).
                new StudentSeed("Beatrice Nyirahabimana", "student19@auca.ac.rw", "Offline-First Market Price Reporting App",
                        "A crowd-sourced commodity price app that syncs when connectivity returns.", "Computer Science",
                        150, 120L, 2, 100L, 5L, 10L, true, ThesisStatus.READY_FOR_DEFENSE),

                // Group G — COMPLETED (1).
                new StudentSeed("Innocent Sibomana", "student20@auca.ac.rw", "Automated Timetable Conflict Resolver",
                        "A finished, defended system for resolving university scheduling conflicts.", "Information Systems",
                        200, 120L, 3, 100L, 25L, 30L, false, ThesisStatus.COMPLETED)
        );
    }

    private List<Thesis> seedStudentsAndTheses(List<User> supervisors) {
        List<Thesis> theses = new ArrayList<>();

        for (StudentSeed seed : studentSeeds()) {
            User student = createUser(seed.name(), seed.email(), "Student@1234", Role.STUDENT, null, seed.department());
            LocalDateTime registeredAt = now.minusDays(seed.registeredDaysAgo());
            backdateUser(student.getId(), registeredAt);

            User supervisor = seed.supervisorIndex() != null ? supervisors.get(seed.supervisorIndex()) : null;

            Thesis thesis = Thesis.builder()
                    .student(student)
                    .supervisor(supervisor)
                    .title(seed.title())
                    .description(seed.description())
                    .status(seed.status())
                    .build();
            thesis = thesisRepository.saveAndFlush(thesis);

            LocalDateTime reviewedAt = seed.reviewedDaysAgo() != null ? now.minusDays(seed.reviewedDaysAgo()) : null;
            LocalDateTime supervisorAssignedAt = seed.supervisorAssignedDaysAgo() != null
                    ? now.minusDays(seed.supervisorAssignedDaysAgo()) : null;
            LocalDateTime defenseDate = seed.defenseDaysAgo() != null
                    ? (seed.defenseInFuture() ? now.plusDays(seed.defenseDaysAgo()) : now.minusDays(seed.defenseDaysAgo()))
                    : null;
            LocalDateTime updatedAt = seed.updatedDaysAgo() != null ? now.minusDays(seed.updatedDaysAgo())
                    : (supervisorAssignedAt != null ? supervisorAssignedAt : (reviewedAt != null ? reviewedAt : registeredAt));

            jdbcTemplate.update(
                    "UPDATE theses SET registered_at = ?, prototype_reviewed_at = ?, supervisor_assigned_at = ?, " +
                            "defense_date = ?, updated_at = ? WHERE id = ?",
                    ts(registeredAt), ts(reviewedAt), ts(supervisorAssignedAt), ts(defenseDate), ts(updatedAt), thesis.getId());

            if (supervisor != null) {
                notifyAt(student, "Supervisor assigned",
                        supervisor.getName() + " has been assigned as your thesis supervisor.",
                        NotificationType.SUPERVISOR_ASSIGNED, supervisorAssignedAt);
                notifyAt(supervisor, "New student assigned",
                        student.getName() + " (\"" + thesis.getTitle() + "\") has been assigned to you.",
                        NotificationType.SUPERVISOR_ASSIGNED, supervisorAssignedAt);
            }

            theses.add(thesis);
        }

        return theses;
    }

    // ---------------------------------------------------------------- past slots + bookings

    private List<ReviewSlot> seedPastSlots(User coordinator) {
        long[] daysAgoOffsets = {6, 10, 15, 20, 25, 30, 45, 60, 90, 120};
        int[] capacities = {1, 1, 1, 2, 1, 2, 1, 1, 1, 2};
        String[] locations = {
                "Room B12", "Room B14", "Lab 3", "Room B12", "Lab 1",
                "Room B14", "Room A02", "Lab 3", "Room B12", "Lab 1"
        };

        List<ReviewSlot> slots = new ArrayList<>();
        for (int i = 0; i < daysAgoOffsets.length; i++) {
            LocalDate slotDate = now.minusDays(daysAgoOffsets[i]).toLocalDate();
            ReviewSlot slot = ReviewSlot.builder()
                    .createdBy(coordinator)
                    .slotDate(slotDate)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(9, 30))
                    .capacity(capacities[i])
                    .bookedCount(0)
                    .location(locations[i])
                    .build();
            slot = reviewSlotRepository.saveAndFlush(slot);
            jdbcTemplate.update("UPDATE review_slots SET created_at = ? WHERE id = ?",
                    ts(slotDate.atStartOfDay().minusDays(7)), slot.getId());
            slots.add(slot);
        }
        return slots;
    }

    private void seedPastBookings(List<ReviewSlot> pastSlots, List<Thesis> registered, List<Thesis> prototypeReviewed,
                                   List<Thesis> supervisorAssigned, List<Thesis> inProgress,
                                   List<Thesis> readyForDefense, List<Thesis> completed) {
        // Each slot's index here lines up with the matching student's reviewedDaysAgo in
        // studentSeeds() (both use the same {6,10,15,20,25,30,45,60,90,120} offsets), so the
        // booking's completed_at always falls on the slot's own date — no separately-tracked
        // "days ago" number to accidentally drift out of sync with it.
        completeBooking(pastSlots.get(0), prototypeReviewed.get(1)); // Sandrine, 6d
        completeBooking(pastSlots.get(1), prototypeReviewed.get(0)); // Vincent, 10d
        completeBooking(pastSlots.get(2), prototypeReviewed.get(2)); // Fabrice, 15d
        completeBooking(pastSlots.get(3), supervisorAssigned.get(2)); // Chantal, 20d
        noShowBooking(pastSlots.get(3), registered.get(2)); // Diane no-show, same slot
        completeBooking(pastSlots.get(4), supervisorAssigned.get(1)); // Jean de Dieu, 25d
        completeBooking(pastSlots.get(5), supervisorAssigned.get(0)); // Aimee, 30d
        noShowBooking(pastSlots.get(5), registered.get(3)); // Emmanuel no-show, same slot
        completeBooking(pastSlots.get(6), inProgress.get(1)); // Solange, 45d
        completeBooking(pastSlots.get(7), inProgress.get(0)); // Yves, 60d
        completeBooking(pastSlots.get(8), inProgress.get(2)); // Dominique, 90d
        completeBooking(pastSlots.get(9), readyForDefense.get(0)); // Beatrice, 120d
        completeBooking(pastSlots.get(9), completed.get(0)); // Innocent, 120d, shares the slot
    }

    private void completeBooking(ReviewSlot slot, Thesis thesis) {
        LocalDateTime completedAt = slot.getSlotDate().atTime(9, 30);
        LocalDateTime bookedAt = slot.getSlotDate().atStartOfDay().minusDays(2);

        Booking booking = Booking.builder()
                .thesis(thesis)
                .slot(slot)
                .status(BookingStatus.COMPLETED)
                .reviewerNotes("Prototype reviewed — solid progress, proceed to supervisor assignment.")
                .build();
        booking = bookingRepository.saveAndFlush(booking);
        jdbcTemplate.update("UPDATE bookings SET booked_at = ?, completed_at = ? WHERE id = ?",
                ts(bookedAt), ts(completedAt), booking.getId());
        incrementSlotBookedCount(slot);

        User student = thesis.getStudent();
        notifyAt(student, "Booking confirmed", "Your prototype review slot is confirmed.",
                NotificationType.BOOKING_CONFIRMED, bookedAt);
        notifyAt(student, "Prototype review completed", "Your prototype review has been marked as completed.",
                NotificationType.REVIEW_COMPLETED, completedAt);
    }

    private void noShowBooking(ReviewSlot slot, Thesis thesis) {
        LocalDateTime bookedAt = slot.getSlotDate().atStartOfDay().minusDays(2);

        Booking booking = Booking.builder()
                .thesis(thesis)
                .slot(slot)
                .status(BookingStatus.NO_SHOW)
                .build();
        booking = bookingRepository.saveAndFlush(booking);
        jdbcTemplate.update("UPDATE bookings SET booked_at = ? WHERE id = ?", ts(bookedAt), booking.getId());
        incrementSlotBookedCount(slot);

        User student = thesis.getStudent();
        notifyAt(student, "Booking confirmed", "Your prototype review slot is confirmed.",
                NotificationType.BOOKING_CONFIRMED, bookedAt);
    }

    // ---------------------------------------------------------------- upcoming slots + bookings

    private List<ReviewSlot> seedUpcomingSlots(User coordinator) {
        long[] daysAhead = {3, 5, 7, 10, 14};
        int[] capacities = {2, 2, 3, 2, 1};
        String[] locations = {"Room B12", "Room B14", "Lab 3", "Room A02", "Lab 1"};
        String[] notes = {"Bring your working prototype", null, "Group review session", null, null};

        List<ReviewSlot> slots = new ArrayList<>();
        for (int i = 0; i < daysAhead.length; i++) {
            ReviewSlot slot = ReviewSlot.builder()
                    .createdBy(coordinator)
                    .slotDate(now.plusDays(daysAhead[i]).toLocalDate())
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(9, 30))
                    .capacity(capacities[i])
                    .bookedCount(0)
                    .location(locations[i])
                    .notes(notes[i])
                    .build();
            slot = reviewSlotRepository.saveAndFlush(slot);
            jdbcTemplate.update("UPDATE review_slots SET created_at = ? WHERE id = ?", ts(now.minusDays(2)), slot.getId());
            slots.add(slot);
        }
        return slots;
    }

    private void seedUpcomingBookings(List<ReviewSlot> upcomingSlots, List<Thesis> prototypePending) {
        // slot0 (cap2) gets 2 bookings -> full; slot1 (cap2) gets 1; slot2 (cap3) gets 1; slot3/4 stay empty.
        bookUpcoming(upcomingSlots.get(0), prototypePending.get(0), 3); // Eric
        bookUpcoming(upcomingSlots.get(0), prototypePending.get(3), 2); // Divine
        bookUpcoming(upcomingSlots.get(1), prototypePending.get(1), 5); // Claudine
        bookUpcoming(upcomingSlots.get(2), prototypePending.get(2), 4); // Olivier
    }

    private void bookUpcoming(ReviewSlot slot, Thesis thesis, long bookedDaysAgo) {
        LocalDateTime bookedAt = now.minusDays(bookedDaysAgo);

        Booking booking = Booking.builder()
                .thesis(thesis)
                .slot(slot)
                .status(BookingStatus.BOOKED)
                .build();
        booking = bookingRepository.saveAndFlush(booking);
        jdbcTemplate.update("UPDATE bookings SET booked_at = ? WHERE id = ?", ts(bookedAt), booking.getId());
        incrementSlotBookedCount(slot);

        User student = thesis.getStudent();
        notifyAt(student, "Booking confirmed", "Your prototype review slot is confirmed.",
                NotificationType.BOOKING_CONFIRMED, bookedAt);
    }

    private void incrementSlotBookedCount(ReviewSlot slot) {
        slot.setBookedCount(slot.getBookedCount() + 1);
        reviewSlotRepository.save(slot);
    }

    // ---------------------------------------------------------------- messages

    private void seedMessages(List<Thesis> supervisedTheses) {
        String[][] exchanges = {
                {"S:Hi, I've registered my prototype feedback — when can we start on the literature review?",
                        "V:Let's start with your related-work chapter. Send me a draft outline by Friday.",
                        "S:Sounds good, I'll have it ready."},
                {"S:I've attached my updated methodology section, could you take a look?",
                        "V:Reviewing now — looks solid, a couple of comments coming your way.",
                        "S:Thank you, I'll address them this week.",
                        "V:Great, let's meet Thursday to go over the results chapter."}
        };

        for (int i = 0; i < supervisedTheses.size(); i++) {
            Thesis thesis = supervisedTheses.get(i);
            if (thesis.getSupervisor() == null) {
                continue;
            }
            String[] exchange = exchanges[i % exchanges.length];
            // supervisorAssignedAt on the in-memory entity is stale (it was only set via a
            // later JDBC UPDATE, not through this entity), so reload the real value.
            LocalDateTime supervisorAssignedAt = jdbcTemplate.queryForObject(
                    "SELECT supervisor_assigned_at FROM theses WHERE id = ?", Timestamp.class, thesis.getId())
                    .toLocalDateTime();
            // Hour-based (not day-based) spacing: the most-recently-assigned students in this
            // dataset only have ~2 days of runway since assignment, so a whole multi-message
            // exchange has to comfortably fit within that or later messages land in the future.
            LocalDateTime start = supervisorAssignedAt.plusHours(3);

            for (int m = 0; m < exchange.length; m++) {
                String raw = exchange[m];
                boolean fromStudent = raw.startsWith("S:");
                String content = raw.substring(2);
                User sender = fromStudent ? thesis.getStudent() : thesis.getSupervisor();
                User recipient = fromStudent ? thesis.getSupervisor() : thesis.getStudent();

                Message message = Message.builder()
                        .thesis(thesis)
                        .sender(sender)
                        .content(content)
                        .build();
                message = messageRepository.saveAndFlush(message);
                LocalDateTime sentAt = start.plusHours(m * 5L);
                jdbcTemplate.update("UPDATE messages SET sent_at = ? WHERE id = ?", ts(sentAt), message.getId());

                notifyAt(recipient, "New message",
                        sender.getName() + " sent you a message about \"" + thesis.getTitle() + "\".",
                        NotificationType.NEW_MESSAGE, sentAt);
            }
        }
    }

    // ---------------------------------------------------------------- helpers

    /**
     * Creates a notification and immediately backdates it by its own id — {@code notify()}
     * flushes, so the row is guaranteed to exist for this follow-up UPDATE (an earlier version
     * of this backdated by "most recent notification of this type for this user" via a
     * subquery, which silently missed rows before the flush fix landed in
     * {@code NotificationService}).
     */
    private void notifyAt(User user, String title, String message, NotificationType type, LocalDateTime createdAt) {
        Notification notification = notificationService.notify(user, title, message, type);
        jdbcTemplate.update("UPDATE notifications SET created_at = ? WHERE id = ?", ts(createdAt), notification.getId());
    }

    private static Timestamp ts(LocalDateTime dt) {
        return dt != null ? Timestamp.valueOf(dt) : null;
    }
}
