import { useState } from 'react';
import { queryAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'read', label: 'Read' },
  { id: 'responded', label: 'Responded' },
];

const statusBadge = (status) => {
  const map = {
    new: 'bg-blue-100 text-blue-800',
    read: 'bg-gray-100 text-gray-700',
    responded: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const QueryDetail = ({ query, onClose, onUpdate }) => {
  const [status, setStatus] = useState(query.status);
  const [adminNotes, setAdminNotes] = useState(query.adminNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await queryAPI.update(query._id, { status, adminNotes });
      toast.success('Query updated.');
      onUpdate();
      onClose();
    } catch {
      toast.error('Failed to update query.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-800">{query.subject}</h3>
            <p className="text-sm text-gray-500">{query.name} · {query.email} {query.phone && `· ${query.phone}`}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(query.createdAt).toLocaleString('en-IN')}</p>
          </div>
          {statusBadge(query.status)}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap">
          {query.message}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="responded">Responded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Internal notes about this query..."
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QueriesPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);

  const { data, loading, refetch } = useFetch(() => queryAPI.getAdmin({ status: statusFilter || undefined }), [statusFilter]);

  const queries = data?.queries || [];

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this query?')) return;
    try {
      await queryAPI.delete(id);
      toast.success('Query deleted.');
      refetch();
    } catch {
      toast.error('Failed to delete query.');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">User Queries</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto w-full sm:w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === tab.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
            {tab.id === 'new' && data?.queries?.filter(q => q.status === 'new').length > 0 && (
              <span className="ml-1.5 bg-blue-600 text-white text-xs rounded-full px-1.5">
                {data.queries.filter(q => q.status === 'new').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">💬</div>
          <p>No queries found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queries.map(query => (
            <div
              key={query._id}
              className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${query.status === 'new' ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}
              onClick={() => setSelectedQuery(query)}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">{query.subject}</h3>
                    {statusBadge(query.status)}
                  </div>
                  <p className="text-sm text-gray-500">{query.name} · {query.email}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{query.message}</p>
                </div>
                <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                  {new Date(query.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(query._id); }}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQuery && (
        <QueryDetail
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
          onUpdate={refetch}
        />
      )}
    </div>
  );
};

export default QueriesPage;
