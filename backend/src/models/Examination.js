import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema(
  {
    examCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Examination title is required'],
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    term: {
      type: String,
      enum: ['quiz', 'midterm', 'final', 'project'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Examination = mongoose.model('Examination', examinationSchema);
