import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema(
  {
    sessionCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    sessionDate: {
      type: Date,
      default: Date.now,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    sessionSecret: {
      type: String,
      required: true,
      select: false,
    },
    lateThresholdMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
