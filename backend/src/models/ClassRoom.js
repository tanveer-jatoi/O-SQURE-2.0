import mongoose from 'mongoose';

const classRoomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      enum: ['theory_room', 'computer_lab'],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 5,
      max: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const ClassRoom = mongoose.model('ClassRoom', classRoomSchema);
