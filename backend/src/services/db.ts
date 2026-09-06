import mongoose from 'mongoose';
import { config } from '../config/index.js';

/**
 * Injects the database name into the Atlas URI if it is missing.
 * Atlas URIs without a dbName default to "test" — we always want "privatekernel".
 */
function ensureDbName(uri: string, dbName = 'privatekernel'): string {
  try {
    const url = new URL(uri);
    // If pathname is empty or just "/" there is no dbName — inject it
    if (!url.pathname || url.pathname === '/') {
      url.pathname = `/${dbName}`;
      return url.toString();
    }
    return uri;
  } catch {
    return uri; // not a valid URL — let Mongoose handle it
  }
}

export const connectDB = async (): Promise<string> => {
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI environment variable is not configured');
  }

  const uri = ensureDbName(config.mongoUri);

  // Mongoose connection event handlers for visibility
  mongoose.connection.on('connected', () =>
    console.log('[DB] MongoDB Atlas connection established')
  );
  mongoose.connection.on('disconnected', () =>
    console.warn('[DB] MongoDB Atlas disconnected — will attempt reconnect')
  );
  mongoose.connection.on('reconnected', () =>
    console.log('[DB] MongoDB Atlas reconnected')
  );
  mongoose.connection.on('error', (err) =>
    console.error('[DB] MongoDB connection error:', err.message)
  );

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    // Keep the connection alive — important for long-running Atlas free-tier clusters
    heartbeatFrequencyMS: 10000,
  });

  console.log('[DB] Connected to MongoDB Atlas');
  return uri;
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('[DB] MongoDB connection closed');
};