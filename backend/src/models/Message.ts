import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  duration?: number; // For audio/voice
}

export interface IReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: mongoose.Types.ObjectId;
  reactions: IReaction[];
  attachments: IAttachment[];
  isEdited: boolean;
  isDeletedForEveryone: boolean;
  deletedForUsers: mongoose.Types.ObjectId[];
  starredBy: mongoose.Types.ObjectId[];
  deliveredTo: mongoose.Types.ObjectId[];
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  duration: { type: Number }
});

const ReactionSchema = new Schema<IReaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, default: '' },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'voice', 'system'],
      default: 'text'
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    reactions: [ReactionSchema],
    attachments: [AttachmentSchema],
    isEdited: { type: Boolean, default: false },
    isDeletedForEveryone: { type: Boolean, default: false },
    deletedForUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
