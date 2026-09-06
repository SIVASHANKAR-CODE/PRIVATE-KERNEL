import mongoose, { Document, Schema } from 'mongoose';

export interface IConversationMember extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  unreadCount: number;
  lastReadMessageId?: mongoose.Types.ObjectId;
  isMuted: boolean;
  joinedAt: Date;
}

const ConversationMemberSchema = new Schema<IConversationMember>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    unreadCount: { type: Number, default: 0 },
    lastReadMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    isMuted: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const ConversationMember = mongoose.model<IConversationMember>('ConversationMember', ConversationMemberSchema);
