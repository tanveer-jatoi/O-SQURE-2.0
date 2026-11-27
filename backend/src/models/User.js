import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [40, 'Username cannot exceed 40 characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'teacher', 'student'],
      required: [true, 'User role is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password automatically before saving when modified
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);

  if (!this.isNew) {
    // Subtract 1s to avoid race conditions with token iat timestamps
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  return next();
});

// Verify candidate password against stored bcrypt hash
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check whether temporary brute-force lock is currently active
userSchema.methods.isCurrentlyLocked = function isCurrentlyLocked() {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

// Increment failed attempts and lock account after MAX_FAILED_ATTEMPTS
userSchema.methods.recordFailedLogin = async function recordFailedLogin() {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await this.save({ validateBeforeSave: false });
};

// Reset brute-force counters on successful login
userSchema.methods.resetLoginAttempts = async function resetLoginAttempts() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

// Invalidate JWTs issued prior to the last password change
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIssuedAtSeconds) {
  if (!this.passwordChangedAt) {
    return false;
  }
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtIssuedAtSeconds < changedTimestamp;
};

export const User = mongoose.model('User', userSchema);
