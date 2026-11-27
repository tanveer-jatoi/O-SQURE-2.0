import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, 'Father/Guardian name is required'],
      trim: true,
    },
    cnicBForm: {
      type: String,
      required: [true, 'CNIC or B-Form number is required'],
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    guardianPhone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    academicStatus: {
      type: String,
      enum: ['active', 'graduated', 'dropped', 'suspended'],
      default: 'active',
      index: true,
    },
    currentBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export const Student = mongoose.model('Student', studentSchema);
