# BarangayBook Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        bigint id PK
        string name
        string email UK
        string password
        enum role
        string phone "nullable"
        string purok "nullable"
        timestamp created_at
        timestamp updated_at
    }
    FACILITIES {
        bigint id PK
        string name
        text description
        unsigned_smallint capacity
        decimal fee
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    EQUIPMENT_CATEGORIES {
        bigint id PK
        string name UK
        timestamp created_at
        timestamp updated_at
    }
    EQUIPMENT {
        bigint id PK
        bigint category_id FK
        string name
        unsigned_integer total_quantity
        enum condition
        timestamp created_at
        timestamp updated_at
    }
    RESERVATIONS {
        bigint id PK
        bigint user_id FK
        bigint facility_id FK
        bigint reviewed_by FK "nullable"
        date event_date
        time start_time
        time end_time
        text purpose
        unsigned_smallint expected_guests
        enum status
        text admin_remarks "nullable"
        timestamp created_at
        timestamp updated_at
    }
    EQUIPMENT_RESERVATION {
        bigint id PK
        bigint reservation_id FK
        bigint equipment_id FK
        unsigned_integer quantity
    }
    PERSONAL_ACCESS_TOKENS {
        bigint id PK
        string tokenable_type
        bigint tokenable_id
        string name
        string token UK
        text abilities
        timestamp expires_at "nullable"
    }

    USERS ||--o{ RESERVATIONS : requests
    USERS o|--o{ RESERVATIONS : reviews
    FACILITIES ||--o{ RESERVATIONS : hosts
    EQUIPMENT_CATEGORIES ||--o{ EQUIPMENT : groups
    RESERVATIONS ||--o{ EQUIPMENT_RESERVATION : requests
    EQUIPMENT ||--o{ EQUIPMENT_RESERVATION : allocated
    USERS ||--o{ PERSONAL_ACCESS_TOKENS : authenticates
```

`reviewed_by` is nullable until an administrator approves or rejects a reservation. The equipment pivot has a unique `(reservation_id, equipment_id)` pair and cascades when its reservation is deleted. Facility, equipment, and user records referenced by reservations are restricted from deletion to preserve booking history. Laravel also creates password-reset, cache, job, and migration tables for framework operations; those are omitted from this domain diagram.
