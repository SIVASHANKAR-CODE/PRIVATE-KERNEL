import mongoose, { Document, Schema } from 'mongoose';

export interface IBlockedUser extends Document {
  userId: mongoose.Types.ObjectId;
  blockedUserId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BlockedUserSchema = new Schema<IBlockedUser>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blockedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BlockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

export const BlockedUser = mongoose.model<IBlockedUser>('BlockedUser', BlockedUserSchema);
