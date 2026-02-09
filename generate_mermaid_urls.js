const sysArch = `graph TD
    subgraph Client_Services ["Client Services"]
        FE["Frontend (Next.js)"]
    end

    subgraph Backend_Services ["Backend Services"]
        API["Backend API (Express/Node)"]
        BG["Background Services (Worker)"]
    end

    subgraph Data_Layer ["Data Layer"]
        DB[("PostgreSQL")]
    end

    subgraph External_Services ["External Services"]
        Swypt["Swypt Payment Gateway"]
        Cloud["Cloudinary (Images)"]
        Email["SMTP / Nodemailer"]
    end

    FE -->|HTTP Requests| API
    FE -->|Checkout Flow| Swypt
    API -->|Query/Update| DB
    BG -->|Cron/Jobs| DB
    API -->|Auth/Payments| Swypt
    API -->|Uploads| Cloud
    BG -->|Send Mails| Email`;

const userFlow = `sequenceDiagram
    participant M as Merchant
    participant FE as Frontend
    participant API as Backend API
    participant DB as Main Database

    Note over M, DB: Merchant Onboarding Flow
    M->>FE: Access Sign Up Page
    FE->>API: POST /auth/register
    API->>DB: Create User Record
    API-->>FE: Success Response
    FE-->>M: Redirect to Login

    Note over M, DB: Dashboard Access
    M->>FE: Enter Credentials
    FE->>API: POST /auth/login
    API->>DB: Validate User
    DB-->>API: User Data
    API-->>FE: Return JWT Token
    FE->>FE: Store Token & Redirect to Dashboard

    Note over M, DB: Stock Management
    M->>FE: Adjust Stock Level
    FE->>API: POST /inventory/adjust
    API->>DB: Update Product Count & Create Movement Record
    DB-->>API: Confirmation
    API-->>FE: Updated Stock Data
    FE-->>M: Show Success Notification`;

console.log('SYS_ARCH_URL=https://mermaid.ink/img/' + Buffer.from(sysArch).toString('base64'));
console.log('USER_FLOW_URL=https://mermaid.ink/img/' + Buffer.from(userFlow).toString('base64'));
