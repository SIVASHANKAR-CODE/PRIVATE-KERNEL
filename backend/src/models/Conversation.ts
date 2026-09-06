import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  createdBy?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  isArchivedBy: mongoose.Types.ObjectId[];
  isPinnedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['direct', 'group'], required: true },
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    avatar: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    isArchivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPinnedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
