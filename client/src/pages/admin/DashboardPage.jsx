import { adminAPI } from '../../api/endpoints';
import { formatINR, formatDateTime } from '../../utils/formatDate';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { data, loading } = useFetch(() => adminAPI.getDashboard());

  if (loading) return <LoadingSpinner fullPage />;

  const stats = data?.stats || {};
  const recentBookings = data?.recentBookings || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <StatCard label="Students" value={stats.totalUsers ?? '—'} icon="👥" color="bg-blue-100" />
        <StatCard label="Total Bookings" value={stats.totalBookings ?? '—'} icon="📅" color="bg-purple-100" />
        <StatCard label="Pending" value={stats.pendingPayments ?? '—'} icon="⏳" color="bg-yellow-100" />
        <StatCard label="Confirmed" value={stats.confirmedBookings ?? '—'} icon="✅" color="bg-green-100" />
        <StatCard label="Revenue" value={formatINR(stats.totalRevenue ?? 0)} color="bg-emerald-100" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-sm text-primary-600 hover:underline">View all →</Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-gray-400 text-sm p-5">No bookings yet.</p>
        ) : (
          <>
            {/* Table — md and up */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Student</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Session</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Date</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-4">
                        <div className="font-medium">{b.studentId?.name}</div>
                        <div className="text-gray-400 text-xs">{b.studentId?.email}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div>{b.slotId?.title}</div>
                        <div className="text-gray-400 text-xs">{b.slotId?.categoryId?.name}</div>
                      </td>
                      <td className="py-2.5 px-4 text-gray-500">{formatDateTime(b.slotId?.startTime)}</td>
                      <td className="py-2.5 px-4"><BookingStatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Cards — mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentBookings.map((b) => (
                <div key={b._id} className="p-4 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{b.studentId?.name}</p>
                      <p className="text-xs text-gray-400">{b.slotId?.title}</p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-gray-400">{formatDateTime(b.slotId?.startTime)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
