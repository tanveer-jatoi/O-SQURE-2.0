/**
 * Wraps an asynchronous Express route handler so rejected promises
 * automatically flow into Express's next(err) error middleware.
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
