export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p>Platform administration and analytics.</p>
      
      {/* TODO: Add real-time metrics and store approvals */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4 bg-gray-50 shadow-sm">
          <h2 className="text-xl font-semibold">Store Approvals</h2>
          <p className="text-gray-600 mt-2">0 pending approvals</p>
        </div>
        <div className="border rounded p-4 bg-gray-50 shadow-sm">
          <h2 className="text-xl font-semibold">System Health</h2>
          <p className="text-green-600 font-bold mt-2">All systems operational</p>
        </div>
      </div>
    </div>
  );
}
