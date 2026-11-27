import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema);
