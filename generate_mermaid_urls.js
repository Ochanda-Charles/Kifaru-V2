const sysArch = `graph TD
    subgraph Client["Client Layer"]
        FE["Frontend - Next.js 14"]
        IFrame["Fonbnk Widget - iframe"]
    end

    subgraph Backend["Backend Services"]
        API["Backend API - Express/Node"]
        BG["Background Services - Worker"]
    end

    subgraph Data["Data Layer"]
        DB[("PostgreSQL")]
    end

    subgraph Fonbnk["Fonbnk Payment Gateway"]
        Widget["sandbox-pay.fonbnk.com"]
        WHook["Webhook Notifications"]
    end

    subgraph Blockchain["Blockchain"]
        Celo["Celo Network"]
        USDT["USDT Token"]
        Wallet["Merchant Wallet"]
    end

    subgraph External["Other External Services"]
        Cloud["Cloudinary - Images"]
        Email["SMTP / Nodemailer"]
    end

    FE -->|HTTP Requests| API
    FE -->|Opens iframe| IFrame
    IFrame -->|Loads widget| Widget
    API -->|JWT signed widget URL| FE
    Widget -->|M-Pesa STK Push| Widget
    Widget -->|On-ramp KES to USDT| Celo
    Celo --> USDT --> Wallet
    WHook -->|POST /webhook status update| API
    API -->|Query/Update| DB
    BG -->|Cron/Jobs| DB
    API -->|Uploads| Cloud
    BG -->|Send Mails| Email`;

const paymentFlow = `sequenceDiagram
    participant C as Customer
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant F as Fonbnk Gateway
    participant MP as M-Pesa
    participant BC as Celo Blockchain
    participant W as Merchant Wallet

    Note over C, W: Checkout and Payment Flow

    C->>FE: Select products and click Checkout
    FE->>API: POST /api/inventory/checkout with cart items
    API->>DB: Create Transaction status PENDING
    DB-->>API: Transaction ID + orderParams
    API-->>FE: Checkout confirmed

    FE->>API: POST /api/swypt/widget-url with amount, merchant_id
    API->>API: Sign JWT with HS256 using unique uid + wallet address
    API->>API: Build widget URL with params network CELO, asset USDT, currency KES
    API-->>FE: Return widgetUrl + orderParams

    FE->>FE: Open FonbnkCheckoutModal
    FE->>F: Load widget iframe at sandbox-pay.fonbnk.com/auto-order
    F-->>FE: Display M-Pesa payment form

    C->>F: Enter phone number and confirm payment
    F->>MP: Initiate M-Pesa STK Push
    MP-->>C: M-Pesa PIN prompt on phone
    C->>MP: Confirm with PIN
    MP-->>F: Payment confirmed KES received

    F->>BC: On-ramp Convert KES to USDT
    BC->>W: Transfer USDT to merchant wallet

    F->>FE: postMessage order-created with orderId
    FE->>FE: Close modal and show success

    F->>API: POST /api/swypt/webhook with signed x-signature header
    API->>API: Verify signature SHA256 or HMAC
    API->>DB: UPDATE Transaction SET status COMPLETED with payment_metadata
    DB-->>API: Confirmation`;

const userFlow = `sequenceDiagram
    participant M as Merchant
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL

    Note over M, DB: Merchant Onboarding
    M->>FE: Access Sign Up Page
    FE->>API: POST /api/signup
    API->>DB: Create User Record
    API-->>FE: Success Response
    FE-->>M: Redirect to Login

    Note over M, DB: Dashboard Access
    M->>FE: Enter Credentials
    FE->>API: POST /api/auth/login
    API->>DB: Validate User
    DB-->>API: User Data
    API-->>FE: Return JWT Token
    FE->>FE: Store Token and Redirect to Dashboard

    Note over M, DB: Inventory Management
    M->>FE: Add or Edit Products
    FE->>API: POST /api/AddProduct
    API->>DB: Insert or Update Product
    DB-->>API: Confirmation
    API-->>FE: Updated Product List

    Note over M, DB: Stock Adjustment
    M->>FE: Adjust Stock Level
    FE->>API: POST /api/inventory/adjust
    API->>DB: Update Count and Create Movement Record
    DB-->>API: Confirmation
    API-->>FE: Updated Stock Data
    FE-->>M: Show Success Notification

    Note over M, DB: Customer Checkout - see Payment Flow Diagram
    M->>FE: Share checkout link with customer
    FE->>FE: Customer opens checkout and pays via Fonbnk
    FE-->>M: Transaction appears in dashboard`;

const encode = (chart) => Buffer.from(chart).toString('base64');

console.log('SYS_ARCH_URL=https://mermaid.ink/img/' + encode(sysArch));
console.log('');
console.log('PAYMENT_FLOW_URL=https://mermaid.ink/img/' + encode(paymentFlow));
console.log('');
console.log('USER_FLOW_URL=https://mermaid.ink/img/' + encode(userFlow));
