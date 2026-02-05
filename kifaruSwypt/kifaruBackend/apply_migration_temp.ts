import { sqlConfig } from './src/config/sqlConfig';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
    try {
        // Correct path pointing to migrations folder
        const sqlPath = path.join(__dirname, '..', 'migrations', '002_create_transactions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration: 002_create_transactions.sql');
        await sqlConfig.query(sql);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
