import dotenv from 'dotenv';
import { startApiServer } from './api/server';
import { startWorker } from './worker/processor';

dotenv.config();

console.log('Starting Unified Backend...');

// Start the Express API
startApiServer();

// Start the BullMQ Worker
startWorker();


