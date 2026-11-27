import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    examinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    examSubjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSubject',
      required: true,
      index: true,
    },
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
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ['Distinction', 'Credit', 'Pass', 'Fail'],
      required: true,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    enteredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

resultSchema.index({ examSubjectId: 1, studentId: 1 }, { unique: true });

export const Result = mongoose.model('Result', resultSchema);
