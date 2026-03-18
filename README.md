# Kifaru Fonbnk

Kifaru Fonbnk is a comprehensive solution designed to bridge the gap between cryptocurrency payments and traditional merchant operations. It integrates a robust merchant dashboard with a crypto-payment checkout system, enabling businesses to manage inventory, sales, and payments seamlessly. Fonbnk serves as the onramping service provider, enabling users to convert fiat currency (KES) to crypto (USDT on Celo) via M-Pesa for seamless payment processing.

## System Architecture

The project follows a modern microservices-inspired architecture, separated into three distinct components:

1.  **Frontend (`kifaruFrontend`)**: Built with **Next.js 14**, providing a responsive and dynamic user interface for merchants and customers.
2.  **Backend (`kifaruBackend`)**: A RESTful API built with **Node.js, Express, and TypeScript**, handling business logic, authentication, inventory management, and payment processing.
3.  **Background Services (`bgServices`)**: A dedicated worker service for handling asynchronous tasks like email notifications and scheduled cron jobs.
4.  **Database**: **PostgreSQL** (hosted on Supabase) serves as the primary data store.
5.  **Payment Gateway**: **Fonbnk** handles fiat-to-crypto on-ramping via M-Pesa, converting KES to USDT on the Celo blockchain.
6.  **Infrastructure**: Docker is used for containerization, ensuring consistent environments across development and production.

### System Architecture Diagram

![System Architecture Diagram](https://mermaid.ink/img/Z3JhcGggVEQKICAgIHN1YmdyYXBoIENsaWVudFsiQ2xpZW50IExheWVyIl0KICAgICAgICBGRVsiRnJvbnRlbmQgLSBOZXh0LmpzIDE0Il0KICAgICAgICBJRnJhbWVbIkZvbmJuayBXaWRnZXQgLSBpZnJhbWUiXQogICAgZW5kCgogICAgc3ViZ3JhcGggQmFja2VuZFsiQmFja2VuZCBTZXJ2aWNlcyJdCiAgICAgICAgQVBJWyJCYWNrZW5kIEFQSSAtIEV4cHJlc3MvTm9kZSJdCiAgICAgICAgQkdbIkJhY2tncm91bmQgU2VydmljZXMgLSBXb3JrZXIiXQogICAgZW5kCgogICAgc3ViZ3JhcGggRGF0YVsiRGF0YSBMYXllciJdCiAgICAgICAgREJbKCJQb3N0Z3JlU1FMIildCiAgICBlbmQKCiAgICBzdWJncmFwaCBGb25ibmtbIkZvbmJuayBQYXltZW50IEdhdGV3YXkiXQogICAgICAgIFdpZGdldFsic2FuZGJveC1wYXkuZm9uYm5rLmNvbSJdCiAgICAgICAgV0hvb2tbIldlYmhvb2sgTm90aWZpY2F0aW9ucyJdCiAgICBlbmQKCiAgICBzdWJncmFwaCBCbG9ja2NoYWluWyJCbG9ja2NoYWluIl0KICAgICAgICBDZWxvWyJDZWxvIE5ldHdvcmsiXQogICAgICAgIFVTRFRbIlVTRFQgVG9rZW4iXQogICAgICAgIFdhbGxldFsiTWVyY2hhbnQgV2FsbGV0Il0KICAgIGVuZAoKICAgIHN1YmdyYXBoIEV4dGVybmFsWyJPdGhlciBFeHRlcm5hbCBTZXJ2aWNlcyJdCiAgICAgICAgQ2xvdWRbIkNsb3VkaW5hcnkgLSBJbWFnZXMiXQogICAgICAgIEVtYWlsWyJTTVRQIC8gTm9kZW1haWxlciJdCiAgICBlbmQKCiAgICBGRSAtLT58SFRUUCBSZXF1ZXN0c3wgQVBJCiAgICBGRSAtLT58T3BlbnMgaWZyYW1lfCBJRnJhbWUKICAgIElGcmFtZSAtLT58TG9hZHMgd2lkZ2V0fCBXaWRnZXQKICAgIEFQSSAtLT58SldUIHNpZ25lZCB3aWRnZXQgVVJMfCBGRQogICAgV2lkZ2V0IC0tPnxNLVBlc2EgU1RLIFB1c2h8IFdpZGdldAogICAgV2lkZ2V0IC0tPnxPbi1yYW1wIEtFUyB0byBVU0RUfCBDZWxvCiAgICBDZWxvIC0tPiBVU0RUIC0tPiBXYWxsZXQKICAgIFdIb29rIC0tPnxQT1NUIC93ZWJob29rIHN0YXR1cyB1cGRhdGV8IEFQSQogICAgQVBJIC0tPnxRdWVyeS9VcGRhdGV8IERCCiAgICBCRyAtLT58Q3Jvbi9Kb2JzfCBEQgogICAgQVBJIC0tPnxVcGxvYWRzfCBDbG91ZAogICAgQkcgLS0+fFNlbmQgTWFpbHN8IEVtYWls)

## Payment Integration (Fonbnk)

Fonbnk is the payment gateway that enables fiat-to-crypto on-ramping for the checkout process. Here's how it works:

-   **On-ramp flow**: Customers pay in KES (Kenyan Shilling) via M-Pesa. Fonbnk converts KES to USDT and settles it on the Celo blockchain to the merchant's wallet address.
-   **Frontend widget**: The `FonbnkCheckoutModal` component embeds Fonbnk's payment widget via an iframe. It listens for `postMessage` events (`order-created`, `close-iframe`) to track payment progress.
-   **Widget URL generation**: The backend signs a JWT (HS256) containing a unique `uid` and the merchant's wallet address using `FONBNK_URL_SIGNATURE_SECRET`. The signed URL includes parameters for network (CELO), asset (USDT), currency (KES), payment channel (mobile_money), and flow (onramp).
-   **Webhook verification**: Fonbnk sends payment status updates to `POST /api/swypt/webhook`. The backend verifies the signature using SHA256 (with HMAC legacy fallback) and updates the transaction status accordingly.
-   **Transaction matching**: Webhooks are matched to transactions via `fonbnk_order_id`/`fonbnk_order_params`, with fallback matching by amount and wallet address within a 2-hour window.

### Payment Flow Diagram

![Payment Flow Diagram](https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtCiAgICBwYXJ0aWNpcGFudCBDIGFzIEN1c3RvbWVyCiAgICBwYXJ0aWNpcGFudCBGRSBhcyBGcm9udGVuZAogICAgcGFydGljaXBhbnQgQVBJIGFzIEJhY2tlbmQgQVBJCiAgICBwYXJ0aWNpcGFudCBEQiBhcyBQb3N0Z3JlU1FMCiAgICBwYXJ0aWNpcGFudCBGIGFzIEZvbmJuayBHYXRld2F5CiAgICBwYXJ0aWNpcGFudCBNUCBhcyBNLVBlc2EKICAgIHBhcnRpY2lwYW50IEJDIGFzIENlbG8gQmxvY2tjaGFpbgogICAgcGFydGljaXBhbnQgVyBhcyBNZXJjaGFudCBXYWxsZXQKCiAgICBOb3RlIG92ZXIgQywgVzogQ2hlY2tvdXQgYW5kIFBheW1lbnQgRmxvdwoKICAgIEMtPj5GRTogU2VsZWN0IHByb2R1Y3RzIGFuZCBjbGljayBDaGVja291dAogICAgRkUtPj5BUEk6IFBPU1QgL2FwaS9pbnZlbnRvcnkvY2hlY2tvdXQgd2l0aCBjYXJ0IGl0ZW1zCiAgICBBUEktPj5EQjogQ3JlYXRlIFRyYW5zYWN0aW9uIHN0YXR1cyBQRU5ESU5HCiAgICBEQi0tPj5BUEk6IFRyYW5zYWN0aW9uIElEICsgb3JkZXJQYXJhbXMKICAgIEFQSS0tPj5GRTogQ2hlY2tvdXQgY29uZmlybWVkCgogICAgRkUtPj5BUEk6IFBPU1QgL2FwaS9zd3lwdC93aWRnZXQtdXJsIHdpdGggYW1vdW50LCBtZXJjaGFudF9pZAogICAgQVBJLT4+QVBJOiBTaWduIEpXVCB3aXRoIEhTMjU2IHVzaW5nIHVuaXF1ZSB1aWQgKyB3YWxsZXQgYWRkcmVzcwogICAgQVBJLT4+QVBJOiBCdWlsZCB3aWRnZXQgVVJMIHdpdGggcGFyYW1zIG5ldHdvcmsgQ0VMTywgYXNzZXQgVVNEVCwgY3VycmVuY3kgS0VTCiAgICBBUEktLT4+RkU6IFJldHVybiB3aWRnZXRVcmwgKyBvcmRlclBhcmFtcwoKICAgIEZFLT4+RkU6IE9wZW4gRm9uYm5rQ2hlY2tvdXRNb2RhbAogICAgRkUtPj5GOiBMb2FkIHdpZGdldCBpZnJhbWUgYXQgc2FuZGJveC1wYXkuZm9uYm5rLmNvbS9hdXRvLW9yZGVyCiAgICBGLS0+PkZFOiBEaXNwbGF5IE0tUGVzYSBwYXltZW50IGZvcm0KCiAgICBDLT4+RjogRW50ZXIgcGhvbmUgbnVtYmVyIGFuZCBjb25maXJtIHBheW1lbnQKICAgIEYtPj5NUDogSW5pdGlhdGUgTS1QZXNhIFNUSyBQdXNoCiAgICBNUC0tPj5DOiBNLVBlc2EgUElOIHByb21wdCBvbiBwaG9uZQogICAgQy0+Pk1QOiBDb25maXJtIHdpdGggUElOCiAgICBNUC0tPj5GOiBQYXltZW50IGNvbmZpcm1lZCBLRVMgcmVjZWl2ZWQKCiAgICBGLT4+QkM6IE9uLXJhbXAgQ29udmVydCBLRVMgdG8gVVNEVAogICAgQkMtPj5XOiBUcmFuc2ZlciBVU0RUIHRvIG1lcmNoYW50IHdhbGxldAoKICAgIEYtPj5GRTogcG9zdE1lc3NhZ2Ugb3JkZXItY3JlYXRlZCB3aXRoIG9yZGVySWQKICAgIEZFLT4+RkU6IENsb3NlIG1vZGFsIGFuZCBzaG93IHN1Y2Nlc3MKCiAgICBGLT4+QVBJOiBQT1NUIC9hcGkvc3d5cHQvd2ViaG9vayB3aXRoIHNpZ25lZCB4LXNpZ25hdHVyZSBoZWFkZXIKICAgIEFQSS0+PkFQSTogVmVyaWZ5IHNpZ25hdHVyZSBTSEEyNTYgb3IgSE1BQwogICAgQVBJLT4+REI6IFVQREFURSBUcmFuc2FjdGlvbiBTRVQgc3RhdHVzIENPTVBMRVRFRCB3aXRoIHBheW1lbnRfbWV0YWRhdGEKICAgIERCLS0+PkFQSTogQ29uZmlybWF0aW9u)

## User & Data Flow

The typical flow for a merchant involves registration, dashboard access, and inventory management.

### Key User Flows
1.  **Merchant Onboarding**: Registration -> Login -> Dashboard Access.
2.  **Inventory Management**: Dashboard -> View Products -> Add/Edit Stock -> Update Database.
3.  **Checkout Process**: Customer Selects Product -> Fonbnk Widget (M-Pesa) -> KES to USDT on Celo -> Webhook Confirms Payment -> Stock Decrement.

### User Flow Diagram

![User Flow Diagram](https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtCiAgICBwYXJ0aWNpcGFudCBNIGFzIE1lcmNoYW50CiAgICBwYXJ0aWNpcGFudCBGRSBhcyBGcm9udGVuZAogICAgcGFydGljaXBhbnQgQVBJIGFzIEJhY2tlbmQgQVBJCiAgICBwYXJ0aWNpcGFudCBEQiBhcyBQb3N0Z3JlU1FMCgogICAgTm90ZSBvdmVyIE0sIERCOiBNZXJjaGFudCBPbmJvYXJkaW5nCiAgICBNLT4+RkU6IEFjY2VzcyBTaWduIFVwIFBhZ2UKICAgIEZFLT4+QVBJOiBQT1NUIC9hcGkvc2lnbnVwCiAgICBBUEktPj5EQjogQ3JlYXRlIFVzZXIgUmVjb3JkCiAgICBBUEktLT4+RkU6IFN1Y2Nlc3MgUmVzcG9uc2UKICAgIEZFLS0+Pk06IFJlZGlyZWN0IHRvIExvZ2luCgogICAgTm90ZSBvdmVyIE0sIERCOiBEYXNoYm9hcmQgQWNjZXNzCiAgICBNLT4+RkU6IEVudGVyIENyZWRlbnRpYWxzCiAgICBGRS0+PkFQSTogUE9TVCAvYXBpL2F1dGgvbG9naW4KICAgIEFQSS0+PkRCOiBWYWxpZGF0ZSBVc2VyCiAgICBEQi0tPj5BUEk6IFVzZXIgRGF0YQogICAgQVBJLS0+PkZFOiBSZXR1cm4gSldUIFRva2VuCiAgICBGRS0+PkZFOiBTdG9yZSBUb2tlbiBhbmQgUmVkaXJlY3QgdG8gRGFzaGJvYXJkCgogICAgTm90ZSBvdmVyIE0sIERCOiBJbnZlbnRvcnkgTWFuYWdlbWVudAogICAgTS0+PkZFOiBBZGQgb3IgRWRpdCBQcm9kdWN0cwogICAgRkUtPj5BUEk6IFBPU1QgL2FwaS9BZGRQcm9kdWN0CiAgICBBUEktPj5EQjogSW5zZXJ0IG9yIFVwZGF0ZSBQcm9kdWN0CiAgICBEQi0tPj5BUEk6IENvbmZpcm1hdGlvbgogICAgQVBJLS0+PkZFOiBVcGRhdGVkIFByb2R1Y3QgTGlzdAoKICAgIE5vdGUgb3ZlciBNLCBEQjogU3RvY2sgQWRqdXN0bWVudAogICAgTS0+PkZFOiBBZGp1c3QgU3RvY2sgTGV2ZWwKICAgIEZFLT4+QVBJOiBQT1NUIC9hcGkvaW52ZW50b3J5L2FkanVzdAogICAgQVBJLT4+REI6IFVwZGF0ZSBDb3VudCBhbmQgQ3JlYXRlIE1vdmVtZW50IFJlY29yZAogICAgREItLT4+QVBJOiBDb25maXJtYXRpb24KICAgIEFQSS0tPj5GRTogVXBkYXRlZCBTdG9jayBEYXRhCiAgICBGRS0tPj5NOiBTaG93IFN1Y2Nlc3MgTm90aWZpY2F0aW9uCgogICAgTm90ZSBvdmVyIE0sIERCOiBDdXN0b21lciBDaGVja291dCAtIHNlZSBQYXltZW50IEZsb3cgRGlhZ3JhbQogICAgTS0+PkZFOiBTaGFyZSBjaGVja291dCBsaW5rIHdpdGggY3VzdG9tZXIKICAgIEZFLT4+RkU6IEN1c3RvbWVyIG9wZW5zIGNoZWNrb3V0IGFuZCBwYXlzIHZpYSBGb25ibmsKICAgIEZFLS0+Pk06IFRyYW5zYWN0aW9uIGFwcGVhcnMgaW4gZGFzaGJvYXJk)

> Diagram images are also available locally in `docs/diagrams/` for use in external documentation.

## Technology Stack & Design Decisions

### Frontend
-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router) was chosen for its server-side rendering capabilities, SEO benefits, and simplified routing.
-   **Styling**: **TailwindCSS** + **Ant Design** ensures a modern, clean aesthetic while providing a rich set of pre-built components for the dashboard.
-   **State/Data**: **Axios** is used for efficient API communication.

### Backend
-   **Runtime**: **Node.js** with **Express** provides a lightweight yet powerful server environment.
-   **Language**: **TypeScript** is strictly enforced to ensure type safety, reduce runtime errors, and improve code maintainability.
-   **Database**: **PostgreSQL** was selected for its reliability, relational integrity, and robust support for complex queries defined in `sqlConfig.ts`.
-   **Architecture**: A helper/service pattern is used (`controllers` -> `services` -> `repositories`) to decouple business logic from data access.

### DevOps
-   **Docker**: A `docker-compose.yaml` file defines the services, making it trivial to spin up the entire stack with a single command.

## Setup & Installation

### Prerequisites
-   Node.js (v18+)
-   Docker & Docker Compose
-   Generic SQL Client (dbeaver, pgadmin)

### Running Locally

1.  **Clone the repository** (if not already local)
2.  **Install dependencies** in each service directory:
    ```bash
    cd kifaru/kifaruBackend && npm install
    cd ../kifaruFrontend && npm install
    cd ../bgServices && npm install
    ```
3.  **Environment Variables**: ensuring `.env` files are set up in each directory matching the examples (not provided in repo for security).
4.  **Run with Docker**:
    ```bash
    cd kifaru
    docker-compose up --build
    ```
    *This will start the Frontend on port 3000 and the Backend on port 4000.*
