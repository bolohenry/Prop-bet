export default function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-900/[0.04] p-8 text-center">
      <div className="text-3xl mb-3 opacity-40">📭</div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
