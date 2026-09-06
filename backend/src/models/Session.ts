import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  isValid: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshToken: { type: String, required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    isValid: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export const Session = mongoose.model<ISession>('Session', SessionSchema);
