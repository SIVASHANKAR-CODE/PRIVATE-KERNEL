import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action:
    | 'ACCOUNT_CREATED'
    | 'EMAIL_VERIFIED'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'PASSWORD_CHANGED'
    | 'PASSWORD_RESET_REQUESTED'
    | 'PROFILE_UPDATED'
    | 'SESSION_REVOKED'
    | 'USER_BLOCKED'
    | 'USER_UNBLOCKED'
    | 'GROUP_CREATED'
    | 'GROUP_UPDATED';
  userId?: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    targetId: { type: Schema.Types.ObjectId },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
