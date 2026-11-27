import mongoose from 'mongoose';

const learningMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    uploadedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resourceUrl: { type: String, required: true, trim: true },
    resourceType: {
      type: String,
      enum: ['pdf', 'slides', 'link', 'code'],
      default: 'pdf',
    },
  },
  { timestamps: true }
);

export const LearningMaterial = mongoose.model('LearningMaterial', learningMaterialSchema);
