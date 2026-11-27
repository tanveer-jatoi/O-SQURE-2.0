import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    teacherId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Teacher full name is required'],
      trim: true,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    specializations: {
      type: [String],
      default: [],
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'resigned'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model('Teacher', teacherSchema);
