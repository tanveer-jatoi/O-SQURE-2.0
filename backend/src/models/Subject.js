import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Subject title is required'],
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
    },
    creditHours: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: 10,
    },
    passingMarks: {
      type: Number,
      default: 50,
      min: 1,
    },
  },
  { timestamps: true }
);

export const Subject = mongoose.model('Subject', subjectSchema);
