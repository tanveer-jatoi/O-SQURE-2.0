import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    totalSemesters: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    durationMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
    },
    baseFee: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);
