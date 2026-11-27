import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Fee structure title is required'],
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    admissionFee: { type: Number, default: 0, min: 0 },
    tuitionFee: { type: Number, required: true, min: 0 },
    labFee: { type: Number, default: 0, min: 0 },
    examFee: { type: Number, default: 0, min: 0 },
    defaultDueDateDay: { type: Number, default: 10, min: 1, max: 28 },
    lateFineAmount: { type: Number, default: 500, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
