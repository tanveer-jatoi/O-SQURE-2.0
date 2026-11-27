import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      default: 'anonymous',
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    action: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    targetEntity: {
      type: String,
      required: true,
      trim: true,
    },
    targetEntityId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

// Compound index for rapid admin security investigations
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ actorUserId: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
