-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT','SUPERVISOR','COORDINATOR','ADMIN')),
    phone VARCHAR(20),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theses table
CREATE TABLE theses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id),
    supervisor_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED'
        CHECK (status IN (
            'REGISTERED',
            'PROTOTYPE_PENDING',
            'PROTOTYPE_REVIEWED',
            'SUPERVISOR_ASSIGNED',
            'IN_PROGRESS',
            'READY_FOR_DEFENSE',
            'COMPLETED'
        )),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prototype_reviewed_at TIMESTAMP,
    supervisor_assigned_at TIMESTAMP,
    defense_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review slots (created by coordinators)
CREATE TABLE review_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    booked_count INT NOT NULL DEFAULT 0,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thesis_id UUID NOT NULL REFERENCES theses(id),
    slot_id UUID NOT NULL REFERENCES review_slots(id),
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED'
        CHECK (status IN ('BOOKED','COMPLETED','NO_SHOW','CANCELLED')),
    reviewer_notes TEXT,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Messages (per thesis thread)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thesis_id UUID NOT NULL REFERENCES theses(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) CHECK (type IN (
        'BOOKING_CONFIRMED',
        'REVIEW_COMPLETED',
        'SUPERVISOR_ASSIGNED',
        'NEW_MESSAGE',
        'STATUS_CHANGED',
        'SLOT_REMINDER',
        'GENERAL'
    )),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thesis documents
CREATE TABLE thesis_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thesis_id UUID NOT NULL REFERENCES theses(id),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size_kb INT,
    version INT DEFAULT 1,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supervisor feedback
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thesis_id UUID NOT NULL REFERENCES theses(id),
    supervisor_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    stage_at_time VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common lookups
CREATE INDEX idx_theses_student_id ON theses(student_id);
CREATE INDEX idx_theses_supervisor_id ON theses(supervisor_id);
CREATE INDEX idx_theses_status ON theses(status);
CREATE INDEX idx_bookings_thesis_id ON bookings(thesis_id);
CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_messages_thesis_id ON messages(thesis_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_thesis_documents_thesis_id ON thesis_documents(thesis_id);
CREATE INDEX idx_feedback_thesis_id ON feedback(thesis_id);
