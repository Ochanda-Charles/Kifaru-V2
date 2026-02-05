# Database Migrations

This directory contains database migration scripts for the KifaruSwypt backend.

## Prerequisites

- Node.js and npm installed.
- PostgreSQL database running.
- `.env` file configured in the parent directory (`kifaruBackend/.env`) with valid `PG_*` credentials.

## Running Migrations

We use a custom TypeScript script to run raw SQL migrations.

### Apply Migrations (Up)

To create the new tables and update existing schemas:

```bash
npx ts-node migrations/migrate.ts up
```

### Revert Migrations (Down)

To rollback changes (drop tables and columns):

```bash
npx ts-node migrations/migrate.ts down
```

## Migration Files

- `001_inventory_up.sql`: Adds Categories, Suppliers, ProductVariants, StockMovements, InventoryAlerts, and updates Products.
- `001_inventory_down.sql`: Reverses `001_inventory_up.sql`.
