import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    attendanceDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused', 'pending'],
      required: true,
      index: true,
    },
    scannedAt: {
      type: Date,
      default: null,
    },
    deviceInfo: {
      type: String,
      default: null,
    },
    isManualCorrection: {
      type: Boolean,
      default: false,
    },
    correctedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    correctionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
