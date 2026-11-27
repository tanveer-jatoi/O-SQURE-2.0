import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { generateCode } from '../utils/idGenerator.js';

/**
 * Atomically provisions a User login account + Student profile.
 * Rolls back the User record if Student creation fails (safe on standalone MongoDB).
 */
export async function provisionStudentAccount(payload, actorUserId) {
  const user = await User.create({
    username: payload.username,
    email: payload.email,
    fullName: payload.fullName,
    passwordHash: payload.password,
    role: 'student',
    status: 'active',
    createdBy: actorUserId,
  });

  try {
    const student = await Student.create({
      userId: user._id,
      studentId: generateCode('OSQ-STU'),
      fullName: payload.fullName,
      fatherName: payload.fatherName,
      cnicBForm: payload.cnicBForm,
      gender: payload.gender,
      dob: new Date(payload.dob),
      contactPhone: payload.contactPhone,
      guardianPhone: payload.guardianPhone,
      address: payload.address,
    });

    return { user, student };
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
}

/**
 * Atomically provisions a User login account + Teacher profile.
 * Rolls back the User record if Teacher profile creation fails.
 */
export async function provisionTeacherAccount(payload, actorUserId) {
  const user = await User.create({
    username: payload.username,
    email: payload.email,
    fullName: payload.fullName,
    passwordHash: payload.password,
    role: 'teacher',
    status: 'active',
    createdBy: actorUserId,
  });

  try {
    const teacher = await Teacher.create({
      userId: user._id,
      teacherId: generateCode('OSQ-FAC'),
      fullName: payload.fullName,
      cnic: payload.cnic,
      contactPhone: payload.contactPhone,
      email: payload.email,
      qualification: payload.qualification,
      specializations: payload.specializations || [],
      joiningDate: payload.joiningDate ? new Date(payload.joiningDate) : new Date(),
    });

    return { user, teacher };
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
}
