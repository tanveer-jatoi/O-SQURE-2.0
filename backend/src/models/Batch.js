import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      required: [true, 'Batch code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    classRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassRoom',
      required: true,
      index: true,
    },
    assignedTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expectedEndDate: {
      type: Date,
      required: true,
    },
    daysPattern: {
      type: String,
      enum: ['MWF', 'TTS', 'DAILY', 'WEEKEND'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'startTime must be HH:MM (24-hour)'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'endTime must be HH:MM (24-hour)'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
  },
  { timestamps: true }
);

export const Batch = mongoose.model('Batch', batchSchema);
