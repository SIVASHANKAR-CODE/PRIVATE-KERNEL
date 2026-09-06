import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  try {
    // Attempt connecting to the configured URI with a 2-second timeout
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`Connected to MongoDB at ${config.mongoUri}`);
    return config.mongoUri;
  } catch (err) {
    console.warn(`Could not connect to external MongoDB at ${config.mongoUri}. Starting embedded in-memory MongoDB...`);
    try {
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`Connected to embedded MongoDB at ${memUri}`);
      return memUri;
    } catch (memErr) {
      console.error('Failed to start embedded MongoDB:', memErr);
      throw memErr;
    }
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
