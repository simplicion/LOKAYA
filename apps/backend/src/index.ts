import 'dotenv/config';
import { startApiServer } from './api/server';
import { startWorker } from './worker/processor';

console.log('Starting Unified Backend...');

// Start the Express API
startApiServer();

// Start the BullMQ Worker
startWorker();
// Connected to AWS RDS PostgreSQL
