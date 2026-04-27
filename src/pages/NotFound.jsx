import { Link } from 'react-router-dom';
import PageTitle from '../components/PageTitle';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <PageTitle title="Page not found" />
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Oops! Page not found.</p>
        <Link
          to="/"
          className="text-brand-600 hover:text-brand-800 font-semibold underline underline-offset-4 transition-colors duration-150"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
