import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: {
      type: String,
      enum: ['all', 'teachers', 'students', 'batch_specific'],
      default: 'all',
      index: true,
    },
    targetBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
