import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'transferred', 'completed', 'dropped'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

enrollmentSchema.index({ studentId: 1, batchId: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
