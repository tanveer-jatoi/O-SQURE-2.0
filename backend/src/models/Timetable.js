import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    classRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoom', required: true, index: true },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
      index: true,
    },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  },
  { timestamps: true }
);

export const Timetable = mongoose.model('Timetable', timetableSchema);
