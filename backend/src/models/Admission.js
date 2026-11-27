import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema(
  {
    inquiryNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, 'Father/Guardian name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    cnicBForm: {
      type: String,
      required: [true, 'CNIC or B-Form is required'],
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
    interestedCourseName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['inquiry', 'interview_scheduled', 'approved', 'rejected', 'enrolled'],
      default: 'inquiry',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    convertedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    processedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const Admission = mongoose.model('Admission', admissionSchema);
