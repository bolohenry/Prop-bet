import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-2">Wedding Prop Bets</h1>
      <p className="text-gray-500 mb-8 text-center">Create a prop bet event for your wedding and let guests play along!</p>
      <Link
        to="/admin/create"
        className="bg-black text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
      >
        Create New Event
      </Link>
    </div>
  );
}
