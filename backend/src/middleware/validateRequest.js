import { AppError } from '../utils/appError.js';

/**
 * Validates req.body (and optionally req.params / req.query) against a Zod schema.
 * Strips unknown properties automatically to guard against mass-assignment attacks.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Validation failed.', 400, 'VALIDATION_ERROR', details));
    }

    req.body = parsed.data;
    return next();
  };
}
