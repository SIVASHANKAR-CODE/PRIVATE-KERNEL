import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to current dir .env

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/privatekernel',
  jwtSecret: process.env.JWT_SECRET || 'private_kernel_jwt_secret_key_prod_and_dev_fallback',
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localPath: path.resolve(process.cwd(), process.env.STORAGE_PATH || 'uploads'),
    endpoint: process.env.STORAGE_ENDPOINT,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    maxFileSize: 25 * 1024 * 1024, // 25 MB default
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'PRIVATE KERNEL <no-reply@privatekernel.internal>'
  }
};
