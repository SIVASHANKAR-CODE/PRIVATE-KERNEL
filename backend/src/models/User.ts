import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPrivacy {
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  profilePhoto: 'everyone' | 'contacts' | 'nobody';
  about: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  typingIndicator: boolean;
}

export interface IUserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    sound: boolean;
    preview: boolean;
    desktop: boolean;
  };
  privacy: IUserPrivacy;
}

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isOnline: boolean;
  lastSeen: Date;
  settings: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: 'Hey there! I am using PRIVATE KERNEL.' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      notifications: {
        sound: { type: Boolean, default: true },
        preview: { type: Boolean, default: true },
        desktop: { type: Boolean, default: true }
      },
      privacy: {
        lastSeen: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
        profilePhoto: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
        about: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
        readReceipts: { type: Boolean, default: true },
        typingIndicator: { type: Boolean, default: true }
      }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
