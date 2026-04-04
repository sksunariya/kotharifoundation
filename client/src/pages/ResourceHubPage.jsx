import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';

// ─── Sidebar playlist item ───────────────────────────────────────────────────
const PlaylistItem = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-l-2 ${
      active
        ? 'bg-primary-50 border-primary-600 text-primary-700'
        : 'border-transparent hover:bg-gray-50 text-gray-700'
    }`}
  >
    <span className="text-lg flex-shrink-0 mt-0.5">{item.isRecording ? '🔴' : '▶️'}</span>
    <div className="min-w-0">
      <p className={`text-sm font-medium truncate ${active ? 'text-primary-700' : 'text-gray-800'}`}>
        {item.title}
      </p>
      {item.description && (
        <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
      )}
      {item.isRecording && (
        <span className="inline-block text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded mt-1 font-medium">
          Session Recording
        </span>
      )}
    </div>
  </button>
);

// ─── Video player ────────────────────────────────────────────────────────────
const VideoPlayer = ({ resource }) => {
  if (!resource?.signedUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400 rounded-xl">
        <div className="text-center">
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-sm">Video unavailable</p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
      <video
        key={resource._id}                 // remount when resource changes
        controls
        controlsList="nodownload"          // hides the download button
        className="w-full h-full"
        src={resource.signedUrl}
      >
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
};

// ─── PDF viewer ──────────────────────────────────────────────────────────────
const PdfViewer = ({ resource }) => {
  if (!resource?.signedUrl) return null;
  return (
    <div className="w-full rounded-xl overflow-hidden shadow border border-gray-200" style={{ height: '75vh' }}>
      <iframe
        key={resource._id}
        src={resource.signedUrl}
        title={resource.title}
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  );
};

// ─── External reference card ─────────────────────────────────────────────────
const ReferenceCard = ({ resource }) => (
  <a
    href={resource.url}
    target="_blank"
    rel="noreferrer"
    className="card hover:shadow-md hover:border-primary-200 transition-all flex items-start gap-3 group"
  >
    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 text-xl">
      🔗
    </div>
    <div className="min-w-0">
      <p className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors text-sm">
        {resource.title}
      </p>
      {resource.description && (
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{resource.description}</p>
      )}
      <p className="text-xs text-primary-500 mt-1 truncate">{resource.url}</p>
    </div>
    <span className="ml-auto text-gray-300 group-hover:text-primary-400 flex-shrink-0">↗</span>
  </a>
);

// ─── Main page ───────────────────────────────────────────────────────────────
const ResourceHubPage = () => {
  const { slotId } = useParams();
  const [videos, setVideos] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active selections
  const [activeVideo, setActiveVideo] = useState(null);
  const [activePdf, setActivePdf] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'pdf'

  useEffect(() => {
    resourceAPI.getForSlot(slotId)
      .then(res => {
        setVideos(res.data.videos);
        setPdfs(res.data.pdfs);
        setLinks(res.data.links);
        // Default selections: prefer recording, else first video/pdf
        const defaultVideo = res.data.videos.find(v => v.isRecording) || res.data.videos[0] || null;
        setActiveVideo(defaultVideo);
        setActivePdf(res.data.pdfs[0] || null);
        setActiveTab(res.data.videos.length > 0 ? 'video' : 'pdf');
      })
      .catch(err => setError(err.response?.data?.message || 'Could not load resources.'))
      .finally(() => setLoading(false));
  }, [slotId]);

  if (loading) return <LoadingSpinner fullPage />;

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <Link to="/my-bookings" className="btn-primary">Back to My Bookings</Link>
    </div>
  );

  const hasContent = videos.length > 0 || pdfs.length > 0 || links.length > 0;

  if (!hasContent) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">📦</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">No Resources Yet</h2>
      <p className="text-gray-500 mb-6">The instructor hasn't uploaded any materials for this session yet.</p>
      <Link to="/my-bookings" className="btn-primary">Back to My Bookings</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/my-bookings" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← My Bookings
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-800">Resource Hub</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar playlist ─────────────────────────── */}
        {(videos.length > 0 || pdfs.length > 0) && (
          <aside className="lg:w-72 flex-shrink-0">
            <div className="card p-0 overflow-hidden">
              {/* Tab switcher */}
              {videos.length > 0 && pdfs.length > 0 && (
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'video' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    🎬 Videos ({videos.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('pdf')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'pdf' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    📄 Notes ({pdfs.length})
                  </button>
                </div>
              )}

              {/* Video playlist */}
              {activeTab === 'video' && videos.length > 0 && (
                <div className="overflow-y-auto max-h-[420px]">
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {videos.length > 0 && pdfs.length === 0 ? `🎬 Videos (${videos.length})` : 'Playlist'}
                  </p>
                  {videos.map(v => (
                    <PlaylistItem
                      key={v._id}
                      item={v}
                      active={activeVideo?._id === v._id}
                      onClick={() => { setActiveVideo(v); setActiveTab('video'); }}
                    />
                  ))}
                </div>
              )}

              {/* PDF playlist */}
              {activeTab === 'pdf' && pdfs.length > 0 && (
                <div className="overflow-y-auto max-h-[420px]">
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {pdfs.length > 0 && videos.length === 0 ? `📄 Notes & PDFs (${pdfs.length})` : 'Documents'}
                  </p>
                  {pdfs.map(p => (
                    <button
                      key={p._id}
                      onClick={() => setActivePdf(p)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-l-2 ${
                        activePdf?._id === p._id
                          ? 'bg-primary-50 border-primary-600'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">📄</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── Main content ──────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Video player */}
          {activeTab === 'video' && activeVideo && (
            <div>
              <VideoPlayer resource={activeVideo} />
              <div className="mt-3">
                <h2 className="font-bold text-gray-800 text-lg">{activeVideo.title}</h2>
                {activeVideo.description && (
                  <p className="text-gray-500 text-sm mt-1">{activeVideo.description}</p>
                )}
              </div>
            </div>
          )}

          {/* PDF viewer */}
          {activeTab === 'pdf' && activePdf && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 text-lg">{activePdf.title}</h2>
                <a
                  href={activePdf.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary-600 hover:underline font-medium"
                >
                  Open in new tab ↗
                </a>
              </div>
              <PdfViewer resource={activePdf} />
            </div>
          )}

          {/* External references */}
          {links.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                <span>🔗</span> External References
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {links.map(link => (
                  <ReferenceCard key={link._id} resource={link} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResourceHubPage;
