import mongoose from 'mongoose';

const examSubjectSchema = new mongoose.Schema(
  {
    examinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'startTime must be HH:MM'],
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 10,
      default: 100,
    },
    passingMarks: {
      type: Number,
      required: true,
      min: 1,
      default: 50,
    },
  },
  { timestamps: true }
);

examSubjectSchema.index({ examinationId: 1, subjectId: 1 }, { unique: true });

export const ExamSubject = mongoose.model('ExamSubject', examSubjectSchema);
