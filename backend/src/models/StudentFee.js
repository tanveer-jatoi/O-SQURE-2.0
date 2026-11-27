import mongoose from 'mongoose';

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    scholarshipAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBilled: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const StudentFee = mongoose.model('StudentFee', studentFeeSchema);
