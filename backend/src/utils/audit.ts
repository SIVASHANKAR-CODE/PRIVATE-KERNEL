import { AuditLog, IAuditLog } from '../models/AuditLog.js';
import mongoose from 'mongoose';

export const logAudit = async (params: {
  action: IAuditLog['action'];
  userId?: mongoose.Types.ObjectId | string;
  targetId?: mongoose.Types.ObjectId | string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}) => {
  try {
    await AuditLog.create({
      action: params.action,
      userId: params.userId ? new mongoose.Types.ObjectId(params.userId.toString()) : undefined,
      targetId: params.targetId ? new mongoose.Types.ObjectId(params.targetId.toString()) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.details
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
