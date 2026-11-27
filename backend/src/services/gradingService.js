import { AppError } from '../utils/appError.js';

/**
 * Computes percentage and standard institutional grade from raw marks.
 * Scale:
 *  - Absent or below passingMarks -> Fail
 *  - >= 85% -> Distinction
 *  - >= 70% -> Credit
 *  - >= passingMarks -> Pass
 */
export function calculateGrade({ marksObtained, totalMarks, passingMarks, isAbsent = false }) {
  if (isAbsent) {
    return {
      marksObtained: 0,
      percentage: 0,
      grade: 'Fail',
    };
  }

  const numericMarks = Number(marksObtained);
  if (Number.isNaN(numericMarks) || numericMarks < 0 || numericMarks > totalMarks) {
    throw new AppError(
      `Marks (${marksObtained}) must be between 0 and ${totalMarks}.`,
      400,
      'INVALID_MARKS'
    );
  }

  const percentage = Math.round((numericMarks / totalMarks) * 10000) / 100;

  let grade = 'Pass';
  if (numericMarks < passingMarks) {
    grade = 'Fail';
  } else if (percentage >= 85) {
    grade = 'Distinction';
  } else if (percentage >= 70) {
    grade = 'Credit';
  }

  return {
    marksObtained: numericMarks,
    percentage,
    grade,
  };
}
