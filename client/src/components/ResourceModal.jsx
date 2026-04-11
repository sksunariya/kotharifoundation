import { useState, useEffect, useCallback } from 'react';
import { resourceAPI } from '../api/endpoints';
import toast from 'react-hot-toast';

const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now();

// ─── Drop Zone ────────────────────────────────────────────────────────────────
const DropZone = ({ accept, onFiles, onCancel }) => {
  const [over, setOver] = useState(false);
  const isVideo = accept === 'video';

  const handle = (files) => {
    const valid = Array.from(files).filter(f =>
      isVideo ? f.type.startsWith('video/') : f.type === 'application/pdf'
    );
    if (!valid.length) { toast.error(`Only ${isVideo ? 'video' : 'PDF'} files accepted.`); return; }
    onFiles(valid);
  };

  return (
    <div className="mb-5">
      <div
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${over ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
      >
        <div className="text-4xl mb-2">{isVideo ? '🎬' : '📄'}</div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          Drag & drop {isVideo ? 'video' : 'PDF'} files here
        </p>
        <p className="text-xs text-gray-400">or <span className="text-primary-600 font-medium">click to browse</span></p>
        <input
          type="file"
          accept={isVideo ? 'video/*' : 'application/pdf,.pdf'}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={e => { handle(e.target.files); e.target.value = ''; }}
        />
      </div>
      <button onClick={onCancel} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
        Cancel
      </button>
    </div>
  );
};

// ─── Video Card ───────────────────────────────────────────────────────────────
const VideoCard = ({ item, isAdmin, isSelected, onSelect, onDelete }) => {
  const isUploading = !!item._tempId;

  return (
    <div
      onClick={!isUploading ? onSelect : undefined}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
        isUploading
          ? 'border-gray-200 cursor-default'
          : isSelected
          ? 'border-primary-500 shadow-md ring-2 ring-primary-100 cursor-pointer'
          : 'border-gray-100 hover:border-primary-300 hover:shadow-sm cursor-pointer'
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-900 relative overflow-hidden">
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-800 px-4">
            <span className="text-2xl">🎬</span>
            <div className="w-full bg-gray-600 rounded-full h-1.5">
              <div
                className="bg-primary-400 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-300">
              {item.status === 'error' ? '✗ Failed' : `${item.progress}%`}
            </span>
          </div>
        ) : item.signedUrl ? (
          <>
            <video
              src={item.signedUrl}
              className="w-full h-full object-cover"
              preload="metadata"
            />
            {!isSelected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
                  <span className="text-gray-800 text-base ml-0.5">▶</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl text-gray-500">🎬</span>
          </div>
        )}

        {item.isRecording && !isUploading && (
          <div className="absolute top-1.5 left-1.5">
            <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">🔴 REC</span>
          </div>
        )}

        {isAdmin && !isUploading && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(item._id); }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full items-center justify-center hidden group-hover:flex transition-colors text-sm font-bold"
            title="Remove"
          >
            ×
          </button>
        )}
      </div>

      {/* Title bar */}
      <div className="px-2.5 py-2 bg-white">
        <p className="text-xs font-medium text-gray-700 truncate">{item.title}</p>
      </div>
    </div>
  );
};

// ─── PDF Card ─────────────────────────────────────────────────────────────────
const PdfCard = ({ item, isAdmin, isSelected, onSelect, onDelete }) => (
  <div
    onClick={onSelect}
    className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
      isSelected
        ? 'border-primary-500 shadow-md ring-2 ring-primary-100'
        : 'border-gray-100 hover:border-primary-300 hover:shadow-sm'
    }`}
  >
    <div className="aspect-video bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center gap-2 p-3 relative overflow-hidden">
      <span className="text-4xl">📄</span>
      <p className="text-xs text-center text-gray-500 line-clamp-2 font-medium">{item.title}</p>
      {!isSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-semibold text-gray-600 bg-white/90 px-2 py-1 rounded-lg shadow">Click to view</span>
        </div>
      )}
    </div>
    <div className="px-2.5 py-2 bg-white flex items-center gap-1">
      <p className="text-xs font-medium text-gray-700 truncate flex-1">{item.title}</p>
      {item.signedUrl && (
        <a
          href={item.signedUrl}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-xs text-primary-500 hover:text-primary-700 flex-shrink-0"
          title="Open in new tab"
        >
          ↗
        </a>
      )}
    </div>
    {isAdmin && (
      <button
        onClick={e => { e.stopPropagation(); onDelete(item._id); }}
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full items-center justify-center hidden group-hover:flex transition-colors text-sm font-bold"
        title="Remove"
      >
        ×
      </button>
    )}
  </div>
);

// ─── Expanded Video Player ────────────────────────────────────────────────────
const VideoViewer = ({ item, onClose }) => (
  <div className="mb-5 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
    <div className="bg-black">
      <video
        key={item._id}
        controls
        controlsList="nodownload"
        className="w-full max-h-[45vh]"
        src={item.signedUrl}
      />
    </div>
    <div className="px-4 py-2.5 bg-white flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
        {item.isRecording && (
          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Session Recording</span>
        )}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs ml-4 flex-shrink-0 underline">
        Collapse
      </button>
    </div>
  </div>
);

// ─── Expanded PDF Viewer ──────────────────────────────────────────────────────
const PdfViewer = ({ item, onClose }) => (
  <div className="mb-5 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
      <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <a href={item.signedUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline font-medium">
          Open in new tab ↗
        </a>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs underline">
          Collapse
        </button>
      </div>
    </div>
    <iframe
      key={item._id}
      src={item.signedUrl}
      title={item.title}
      className="w-full border-0"
      style={{ height: '50vh' }}
      allow="fullscreen"
    />
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────
/**
 * Props:
 *   slot      – { _id, title }
 *   isAdmin   – boolean (default false); controls edit controls
 *   onClose   – () => void
 *
 * Fetch strategy:
 *   isAdmin=true  → resourceAPI.getAdminForSlot → { resources }
 *   isAdmin=false → resourceAPI.getForSlot      → { videos, pdfs, links }
 */
const ResourceModal = ({ slot, isAdmin = false, onClose }) => {
  const [activeTab, setActiveTab] = useState('videos');
  const [savedVideos, setSavedVideos] = useState([]);
  const [savedPdfs,   setSavedPdfs]   = useState([]);
  const [savedLinks,  setSavedLinks]  = useState([]);
  const [uploading,   setUploading]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showDropZone, setShowDropZone] = useState(false);
  const [pendingLinks, setPendingLinks] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load resources on open
  useEffect(() => {
    const fetch = isAdmin
      ? resourceAPI.getAdminForSlot(slot._id)
      : resourceAPI.getForSlot(slot._id);

    fetch
      .then(res => {
        let videos, pdfs, links;
        if (isAdmin) {
          const all = res.data.resources;
          videos = all.filter(r => r.type === 'video');
          pdfs   = all.filter(r => r.type === 'pdf');
          links  = all.filter(r => r.type === 'link');
        } else {
          videos = res.data.videos || [];
          pdfs   = res.data.pdfs   || [];
          links  = res.data.links  || [];
        }
        setSavedVideos(videos);
        setSavedPdfs(pdfs);
        setSavedLinks(links);
        // Auto-select and set starting tab
        if (videos.length > 0) {
          setActiveTab('videos');
          setSelectedItem(videos.find(v => v.isRecording) || videos[0]);
        } else if (pdfs.length > 0) {
          setActiveTab('pdfs');
          setSelectedItem(pdfs[0]);
        } else {
          setActiveTab('links');
        }
      })
      .catch(() => toast.error('Could not load resources.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSelectedItem(null);
    setShowDropZone(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this resource?')) return;
    try {
      await resourceAPI.delete(id);
      setSavedVideos(v => v.filter(r => r._id !== id));
      setSavedPdfs(p => p.filter(r => r._id !== id));
      setSavedLinks(l => l.filter(r => r._id !== id));
      if (selectedItem?._id === id) setSelectedItem(null);
      toast.success('Removed.');
    } catch {
      toast.error('Remove failed.');
    }
  };

  const handleFiles = useCallback(async (files, type) => {
    const existingCount = type === 'video' ? savedVideos.length : savedPdfs.length;
    const entries = files.map((file, i) => {
      const index = existingCount + i;
      const title = type === 'video'
        ? (index === 0 ? 'Session Recording' : `Supplementary Video ${index + 1}`)
        : `Notes / PDF ${index + 1}`;
      return { _tempId: uid(), file, type, title, progress: 0, status: 'uploading' };
    });

    setUploading(prev => [...prev, ...entries]);
    setShowDropZone(false);

    for (const entry of entries) {
      try {
        const isRecording = type === 'video' && savedVideos.length === 0 && entry === entries[0];
        const formData = new FormData();
        formData.append('file', entry.file);
        formData.append('slotId', slot._id);
        formData.append('type', type);
        formData.append('title', entry.title);
        formData.append('isRecording', String(isRecording));

        const { data } = await resourceAPI.uploadFile(formData, (pct) => {
          setUploading(prev => prev.map(e => e._tempId === entry._tempId ? { ...e, progress: pct } : e));
        });

        setUploading(prev => prev.map(e => e._tempId === entry._tempId ? { ...e, status: 'done' } : e));
        if (type === 'video') setSavedVideos(prev => [...prev, data.resource]);
        else                  setSavedPdfs(prev => [...prev, data.resource]);

        setTimeout(() => setUploading(prev => prev.filter(e => e._tempId !== entry._tempId)), 1500);
      } catch {
        setUploading(prev => prev.map(e => e._tempId === entry._tempId ? { ...e, status: 'error' } : e));
        toast.error(`Upload failed: ${entry.file.name}`);
      }
    }
  }, [slot._id, savedVideos.length, savedPdfs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLinkRow    = () => setPendingLinks(prev => [...prev, { _tempId: uid(), title: '', url: '' }]);
  const updateLinkRow = (id, field, val) => setPendingLinks(prev => prev.map(l => l._tempId === id ? { ...l, [field]: val } : l));
  const removeLinkRow = (id) => setPendingLinks(prev => prev.filter(l => l._tempId !== id));

  const saveLink = async (row) => {
    if (!row.title.trim() || !row.url.trim()) { toast.error('Title and URL are required.'); return; }
    try {
      const { data } = await resourceAPI.create({ slotId: slot._id, type: 'link', title: row.title.trim(), url: row.url.trim() });
      setSavedLinks(prev => [...prev, data.resource]);
      setPendingLinks(prev => prev.filter(l => l._tempId !== row._tempId));
      toast.success('Link added.');
    } catch {
      toast.error('Could not save link.');
    }
  };

  const uploadingVideos = uploading.filter(u => u.type === 'video');
  const uploadingPdfs   = uploading.filter(u => u.type === 'pdf');
  const allVideos = [...savedVideos, ...uploadingVideos];
  const allPdfs   = [...savedPdfs,   ...uploadingPdfs];

  const tabs = [
    { key: 'videos', label: 'Videos',          icon: '🎬', count: allVideos.length },
    { key: 'pdfs',   label: 'PDFs & Notes',    icon: '📄', count: allPdfs.length },
    { key: 'links',  label: 'Reference Links', icon: '🔗', count: savedLinks.length },
  ];

  const totalSaved = savedVideos.length + savedPdfs.length + savedLinks.length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-lg text-gray-800">Session Resources</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{slot.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 ml-4 flex-shrink-0 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar + action button */}
        <div className="flex items-center justify-between px-6 border-b border-gray-100 overflow-x-auto">
          <div className="flex flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isAdmin && (activeTab === 'videos' || activeTab === 'pdfs') && (
            <button
              onClick={() => setShowDropZone(v => !v)}
              className="flex-shrink-0 ml-4 flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add {activeTab === 'videos' ? 'Video' : 'PDF'}
            </button>
          )}
          {isAdmin && activeTab === 'links' && (
            <button
              onClick={addLinkRow}
              className="flex-shrink-0 ml-4 flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Link
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : (
          <div className="p-6">

            {/* Drop zone (admin, videos/pdfs tab) */}
            {showDropZone && (
              <DropZone
                accept={activeTab === 'videos' ? 'video' : 'pdf'}
                onFiles={(files) => handleFiles(files, activeTab === 'videos' ? 'video' : 'pdf')}
                onCancel={() => setShowDropZone(false)}
              />
            )}

            {/* Expanded viewer */}
            {selectedItem && activeTab === 'videos' && selectedItem.signedUrl && (
              <VideoViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
            {selectedItem && activeTab === 'pdfs' && selectedItem.signedUrl && (
              <PdfViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}

            {/* ── Videos grid ── */}
            {activeTab === 'videos' && (
              allVideos.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <div className="text-5xl mb-3">🎬</div>
                  <p className="text-sm">No videos yet{isAdmin ? '. Click "+ Add Video" to upload.' : '.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allVideos.map(v => (
                    <VideoCard
                      key={v._id || v._tempId}
                      item={v}
                      isAdmin={isAdmin}
                      isSelected={selectedItem?._id === v._id}
                      onSelect={() => setSelectedItem(prev => prev?._id === v._id ? null : v)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )
            )}

            {/* ── PDFs grid ── */}
            {activeTab === 'pdfs' && (
              allPdfs.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <div className="text-5xl mb-3">📄</div>
                  <p className="text-sm">No PDFs yet{isAdmin ? '. Click "+ Add PDF" to upload.' : '.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allPdfs.map(p => (
                    <PdfCard
                      key={p._id || p._tempId}
                      item={p}
                      isAdmin={isAdmin}
                      isSelected={selectedItem?._id === p._id}
                      onSelect={() => setSelectedItem(prev => prev?._id === p._id ? null : p)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )
            )}

            {/* ── Links list ── */}
            {activeTab === 'links' && (
              savedLinks.length === 0 && pendingLinks.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <div className="text-5xl mb-3">🔗</div>
                  <p className="text-sm">No reference links yet{isAdmin ? '. Click "+ Add Link" to add one.' : '.'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedLinks.map(l => (
                    <div key={l._id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 group transition-colors">
                      <span className="text-xl flex-shrink-0">🔗</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{l.title}</p>
                        <p className="text-xs text-primary-500 truncate">{l.url}</p>
                      </div>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Visit ↗
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(l._id)}
                          className="flex-shrink-0 text-gray-300 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Pending link rows (admin only) */}
                  {isAdmin && pendingLinks.map(row => (
                    <div key={row._tempId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-xl flex-shrink-0">🔗</span>
                      <input
                        className="input py-1.5 text-sm flex-1 min-w-0"
                        placeholder="Title (e.g. Official Docs)"
                        value={row.title}
                        onChange={e => updateLinkRow(row._tempId, 'title', e.target.value)}
                      />
                      <input
                        type="url"
                        className="input py-1.5 text-sm flex-1 min-w-0"
                        placeholder="https://..."
                        value={row.url}
                        onChange={e => updateLinkRow(row._tempId, 'url', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveLink(row)}
                      />
                      <button
                        onClick={() => saveLink(row)}
                        className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => removeLinkRow(row._tempId)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            {totalSaved} resource{totalSaved !== 1 ? 's' : ''} saved for this session
          </p>
          <button onClick={onClose} className="btn-primary px-6">Done</button>
        </div>
      </div>
    </div>
  );
};

export default ResourceModal;
