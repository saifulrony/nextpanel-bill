CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    guest_email VARCHAR(255),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    session_token VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    assigned_to VARCHAR(36),
    subject VARCHAR(255),
    rating INTEGER,
    feedback TEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    sender_id VARCHAR(36),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,
    message_metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
