import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    campusName: { type: String, default: 'O-Square Educational Centre' },
    campusPhone: { type: String, default: '+92-21-30000000' },
    campusEmail: { type: String, default: 'info@osquare-campus.edu' },
    defaultLateThresholdMinutes: { type: Number, default: 15, min: 0, max: 60 },
    defaultLateFineAmount: { type: Number, default: 500, min: 0 },
    attendanceQrRotationSeconds: { type: Number, default: 20, min: 10, max: 60 },
  },
  { timestamps: true }
);

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
