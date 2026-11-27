import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-600">
        <FileQuestion className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        The requested route does not exist inside O-Square 2.0.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Go Home
      </Link>
    </div>
  );
}
