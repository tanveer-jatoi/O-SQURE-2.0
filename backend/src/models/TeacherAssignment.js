import mongoose from 'mongoose';

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

teacherAssignmentSchema.index({ teacherId: 1, batchId: 1, subjectId: 1 }, { unique: true });

export const TeacherAssignment = mongoose.model('TeacherAssignment', teacherAssignmentSchema);
