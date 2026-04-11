import { useState, useEffect, useCallback } from 'react';
import { slotAPI, resourceAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

// ─── Video player ────────────────────────────────────────────────────────────
const VideoPlayer = ({ resource }) => {
  if (!resource?.signedUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400 rounded-xl min-h-[200px]">
        <div className="text-center">
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-sm">Video unavailable or not signed</p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
      <video key={resource._id} controls controlsList="nodownload" className="w-full h-full" src={resource.signedUrl}>
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
};

// ─── PDF viewer ──────────────────────────────────────────────────────────────
const PdfViewer = ({ resource }) => {
  if (!resource?.signedUrl) return null;
  return (
    <div className="w-full rounded-xl overflow-hidden shadow border border-gray-200" style={{ height: '70vh' }}>
      <iframe key={resource._id} src={resource.signedUrl} title={resource.title} className="w-full h-full border-0" allow="fullscreen" />
    </div>
  );
};

// ─── Reference card ──────────────────────────────────────────────────────────
const ReferenceCard = ({ resource, onDelete }) => (
  <div className="card hover:shadow-md transition-all flex items-start gap-3 group">
    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 text-xl">🔗</div>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-gray-800 text-sm">{resource.title}</p>
      {resource.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{resource.description}</p>}
      <a href={resource.url} target="_blank" rel="noreferrer" className="text-xs text-primary-500 mt-1 truncate block hover:underline">{resource.url}</a>
    </div>
    <button onClick={() => onDelete(resource._id)} className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1 rounded opacity-0 group-hover:opacity-100" title="Remove">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

// ─── Playlist item ────────────────────────────────────────────────────────────
const PlaylistItem = ({ item, active, onClick, onDelete }) => (
  <div className={`flex items-start gap-2 px-3 py-2.5 transition-colors border-l-2 group ${active ? 'bg-primary-50 border-primary-600' : 'border-transparent hover:bg-gray-50'}`}>
    <button onClick={onClick} className="flex items-start gap-2 flex-1 text-left min-w-0">
      <span className="text-lg flex-shrink-0 mt-0.5">{item.isRecording ? '🔴' : item.type === 'video' ? '▶️' : '📄'}</span>
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${active ? 'text-primary-700' : 'text-gray-800'}`}>{item.title}</p>
        {item.description && <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>}
        {item.isRecording && <span className="inline-block text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded mt-1 font-medium">Recording</span>}
      </div>
    </button>
    <button onClick={() => onDelete(item._id)} className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100 mt-0.5" title="Remove">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

// ─── Upload progress row ──────────────────────────────────────────────────────
const UploadRow = ({ item, onRetry }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-l-2 border-transparent">
    <span className="text-lg flex-shrink-0">{item.type === 'video' ? '🎬' : '📄'}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
      {item.status === 'uploading' && (
        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-200" style={{ width: `${item.progress}%` }} />
        </div>
      )}
    </div>
    <span className="text-xs font-semibold flex-shrink-0">
      {item.status === 'uploading' && <span className="text-primary-600">{item.progress}%</span>}
      {item.status === 'done' && <span className="text-green-600">✓</span>}
      {item.status === 'error' && (
        <button onClick={onRetry} className="text-red-500 hover:text-primary-600" title="Retry">↺</button>
      )}
    </span>
  </div>
);

// ─── Drop zone ────────────────────────────────────────────────────────────────
const DropZone = ({ accept, label, icon, onFiles }) => {
  const [over, setOver] = useState(false);
  const handle = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith(accept === 'video' ? 'video/' : 'application/pdf'));
    if (!valid.length) { toast.error(`Only ${label} files accepted.`); return; }
    onFiles(valid);
  };
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
      className={`relative border-2 border-dashed rounded-xl px-3 py-4 text-center cursor-pointer transition-colors select-none mx-3 mb-2
        ${over ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs font-medium text-gray-600">Drop {label} or <span className="text-primary-600">browse</span></p>
      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept === 'video' ? 'video/*' : 'application/pdf,.pdf'} multiple
        onChange={e => { handle(e.target.files); e.target.value = ''; }} />
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ResourcesAdminPage = () => {
  const { data: slotsData, loading: slotsLoading } = useFetch(() => slotAPI.getAll({}));
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Resources
  const [savedVideos, setSavedVideos] = useState([]);
  const [savedPdfs,   setSavedPdfs]   = useState([]);
  const [savedLinks,  setSavedLinks]  = useState([]);
  const [uploading,   setUploading]   = useState([]);
  const [resLoading,  setResLoading]  = useState(false);

  // Active selections
  const [activeVideo,  setActiveVideo]  = useState(null);
  const [activePdf,    setActivePdf]    = useState(null);
  const [activeTab,    setActiveTab]    = useState('video');

  // Upload zone visibility
  const [showVideoZone, setShowVideoZone] = useState(false);
  const [showPdfZone,   setShowPdfZone]   = useState(false);

  // Link form
  const [pendingLinks, setPendingLinks] = useState([]);

  const slots = slotsData?.slots || [];

  // Load resources when slot changes
  useEffect(() => {
    if (!selectedSlot) return;
    setResLoading(true);
    setSavedVideos([]); setSavedPdfs([]); setSavedLinks([]);
    setActiveVideo(null); setActivePdf(null);
    setUploading([]); setPendingLinks([]);
    setShowVideoZone(false); setShowPdfZone(false);

    resourceAPI.getAdminForSlot(selectedSlot._id)
      .then(res => {
        const all = res.data.resources || [];
        const vids = all.filter(r => r.type === 'video');
        const pdfs = all.filter(r => r.type === 'pdf');
        const lnks = all.filter(r => r.type === 'link');
        setSavedVideos(vids);
        setSavedPdfs(pdfs);
        setSavedLinks(lnks);
        const defaultVid = vids.find(v => v.isRecording) || vids[0] || null;
        setActiveVideo(defaultVid);
        setActivePdf(pdfs[0] || null);
        setActiveTab(vids.length > 0 ? 'video' : 'pdf');
      })
      .catch(() => toast.error('Could not load resources.'))
      .finally(() => setResLoading(false));
  }, [selectedSlot?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this resource?')) return;
    try {
      await resourceAPI.delete(id);
      setSavedVideos(v => { const n = v.filter(r => r._id !== id); if (activeVideo?._id === id) setActiveVideo(n[0] || null); return n; });
      setSavedPdfs(p => { const n = p.filter(r => r._id !== id); if (activePdf?._id === id) setActivePdf(n[0] || null); return n; });
      setSavedLinks(l => l.filter(r => r._id !== id));
      toast.success('Removed.');
    } catch { toast.error('Remove failed.'); }
  };

  const handleFiles = useCallback(async (files, type) => {
    const existingCount = type === 'video' ? savedVideos.length : savedPdfs.length;
    const entries = files.map((file, i) => {
      const index = existingCount + i;
      const title = type === 'video'
        ? (index === 0 && savedVideos.length === 0 ? 'Session Recording' : `Supplementary Video ${index + 1}`)
        : `Notes / PDF ${index + 1}`;
      return { _tempId: uid(), file, type, title, progress: 0, status: 'uploading' };
    });
    setUploading(prev => [...prev, ...entries]);
    if (type === 'video') setShowVideoZone(false);
    if (type === 'pdf')   setShowPdfZone(false);

    for (const entry of entries) {
      try {
        const isRecording = type === 'video' && savedVideos.length === 0 && entry === entries[0];
        const formData = new FormData();
        formData.append('file', entry.file);
        formData.append('slotId', selectedSlot._id);
        formData.append('type', type);
        formData.append('title', entry.title);
        formData.append('isRecording', String(isRecording));

        const { data } = await resourceAPI.uploadFile(formData, pct =>
          setUploading(prev => prev.map(e => e._tempId === entry._tempId ? { ...e, progress: pct } : e))
        );

        setUploading(prev => prev.map(e => e._tempId === entry._tempId ? { ...e, status: 'done' } : e));
        if (type === 'video') {
          setSavedVideos(prev => { const n = [...prev, data.resource]; if (!activeVideo) setActiveVideo(data.resource); return n; });
          setActiveTab('video');
        } else {
          setSavedPdfs(prev => { const n = [...prev, data.resource]; if (!activePdf) setActivePdf(data.resource); return n; });
        }
        setTimeout(() => setUploading(prev => prev.filter(e => e._tempId !== entry._tempId)), 1800);
      } catch {
        setUploading(prev => prev.map(e => e._tempId === entry._tempId ? { ...e, status: 'error' } : e));
        toast.error(`Upload failed: ${entry.file.name}`);
      }
    }
  }, [selectedSlot, savedVideos.length, savedPdfs.length, activeVideo, activePdf]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLinkRow = () => setPendingLinks(prev => [...prev, { _tempId: uid(), title: '', url: '' }]);
  const updateLinkRow = (id, field, val) => setPendingLinks(prev => prev.map(l => l._tempId === id ? { ...l, [field]: val } : l));
  const removeLinkRow = (id) => setPendingLinks(prev => prev.filter(l => l._tempId !== id));
  const saveLink = async (row) => {
    if (!row.title.trim() || !row.url.trim()) { toast.error('Title and URL are required.'); return; }
    try {
      const { data } = await resourceAPI.create({ slotId: selectedSlot._id, type: 'link', title: row.title.trim(), url: row.url.trim() });
      setSavedLinks(prev => [...prev, data.resource]);
      setPendingLinks(prev => prev.filter(l => l._tempId !== row._tempId));
      toast.success('Link added.');
    } catch { toast.error('Could not save link.'); }
  };

  const uploadingVideos = uploading.filter(u => u.type === 'video');
  const uploadingPdfs   = uploading.filter(u => u.type === 'pdf');
  const hasContent = savedVideos.length > 0 || savedPdfs.length > 0 || savedLinks.length > 0 || uploading.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Resource Hub</h1>

      {/* Slot selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {slotsLoading ? <LoadingSpinner /> : (
          <select
            className="input max-w-sm"
            value={selectedSlot?._id || ''}
            onChange={e => {
              const slot = slots.find(s => s._id === e.target.value) || null;
              setSelectedSlot(slot);
            }}
          >
            <option value="">— Select a session to manage resources —</option>
            {slots.map(s => (
              <option key={s._id} value={s._id}>
                {s.title} · {new Date(s.startTime).toLocaleDateString('en-IN')}
              </option>
            ))}
          </select>
        )}
        {selectedSlot && (
          <span className="text-sm text-gray-400">
            {savedVideos.length + savedPdfs.length + savedLinks.length} resource{savedVideos.length + savedPdfs.length + savedLinks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!selectedSlot ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p>Select a session above to view and manage its resources.</p>
        </div>
      ) : resLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Video / PDF tab switcher */}
              {(savedVideos.length > 0 || uploadingVideos.length > 0 || savedPdfs.length > 0 || uploadingPdfs.length > 0) && (
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'video' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    🎬 Videos ({savedVideos.length + uploadingVideos.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('pdf')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'pdf' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    📄 PDFs ({savedPdfs.length + uploadingPdfs.length})
                  </button>
                </div>
              )}

              {/* Video list */}
              {activeTab === 'video' && (
                <div>
                  {savedVideos.length === 0 && uploadingVideos.length === 0 && !showVideoZone ? (
                    <p className="text-xs text-gray-400 text-center py-4 px-3">No videos yet.</p>
                  ) : (
                    <div className="overflow-y-auto max-h-[320px]">
                      <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Playlist</p>
                      {savedVideos.map(v => (
                        <PlaylistItem key={v._id} item={v} active={activeVideo?._id === v._id}
                          onClick={() => setActiveVideo(v)} onDelete={handleDelete} />
                      ))}
                      {uploadingVideos.map(u => (
                        <UploadRow key={u._tempId} item={u} onRetry={() => {}} />
                      ))}
                    </div>
                  )}
                  {showVideoZone && <DropZone accept="video" label="video" icon="🎬" onFiles={f => handleFiles(f, 'video')} />}
                  <div className="px-3 pb-3 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => setShowVideoZone(v => !v)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      <span className="text-base leading-none">+</span> Upload Video
                    </button>
                  </div>
                </div>
              )}

              {/* PDF list */}
              {activeTab === 'pdf' && (
                <div>
                  {savedPdfs.length === 0 && uploadingPdfs.length === 0 && !showPdfZone ? (
                    <p className="text-xs text-gray-400 text-center py-4 px-3">No PDFs yet.</p>
                  ) : (
                    <div className="overflow-y-auto max-h-[320px]">
                      <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Documents</p>
                      {savedPdfs.map(p => (
                        <PlaylistItem key={p._id} item={p} active={activePdf?._id === p._id}
                          onClick={() => setActivePdf(p)} onDelete={handleDelete} />
                      ))}
                      {uploadingPdfs.map(u => (
                        <UploadRow key={u._tempId} item={u} onRetry={() => {}} />
                      ))}
                    </div>
                  )}
                  {showPdfZone && <DropZone accept="pdf" label="PDF" icon="📄" onFiles={f => handleFiles(f, 'pdf')} />}
                  <div className="px-3 pb-3 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => setShowPdfZone(v => !v)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      <span className="text-base leading-none">+</span> Upload PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Links section in sidebar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-3">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">🔗 Reference Links {savedLinks.length > 0 && <span className="text-xs text-primary-600 ml-1">({savedLinks.length})</span>}</span>
                <button onClick={addLinkRow} className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg transition-colors">+ Add</button>
              </div>
              <div className="p-3 space-y-1.5">
                {savedLinks.length === 0 && pendingLinks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No links yet.</p>
                )}
                {savedLinks.map(l => (
                  <div key={l._id} className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group">
                    <span className="text-sm flex-shrink-0 mt-0.5">🔗</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{l.title}</p>
                      <p className="text-xs text-primary-500 truncate">{l.url}</p>
                    </div>
                    <button onClick={() => handleDelete(l._id)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {pendingLinks.map(row => (
                  <div key={row._tempId} className="space-y-1.5 p-2 bg-gray-50 rounded-xl">
                    <input className="input py-1.5 text-xs" placeholder="Title" value={row.title}
                      onChange={e => updateLinkRow(row._tempId, 'title', e.target.value)} />
                    <input type="url" className="input py-1.5 text-xs" placeholder="https://..."
                      value={row.url} onChange={e => updateLinkRow(row._tempId, 'url', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveLink(row)} />
                    <div className="flex gap-2">
                      <button onClick={() => saveLink(row)} className="flex-1 text-xs bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 rounded-lg transition-colors">Save</button>
                      <button onClick={() => removeLinkRow(row._tempId)} className="text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg transition-colors">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Main content ────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            {!hasContent ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200 border-dashed">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm">No resources yet. Upload a video or PDF using the sidebar.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Video player */}
                {activeTab === 'video' && activeVideo && (
                  <div>
                    <VideoPlayer resource={activeVideo} />
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-gray-800 text-lg">{activeVideo.title}</h2>
                        {activeVideo.description && <p className="text-gray-500 text-sm mt-1">{activeVideo.description}</p>}
                        {activeVideo.isRecording && <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded mt-1 font-medium">Session Recording</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Placeholder if no video selected but videos exist */}
                {activeTab === 'video' && !activeVideo && savedVideos.length > 0 && (
                  <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-400 text-sm">Select a video from the playlist</p>
                  </div>
                )}

                {/* PDF viewer */}
                {activeTab === 'pdf' && activePdf && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-bold text-gray-800 text-lg">{activePdf.title}</h2>
                      {activePdf.signedUrl && (
                        <a href={activePdf.signedUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline font-medium">Open in new tab ↗</a>
                      )}
                    </div>
                    <PdfViewer resource={activePdf} />
                  </div>
                )}

                {/* Placeholder if no PDF selected but PDFs exist */}
                {activeTab === 'pdf' && !activePdf && savedPdfs.length > 0 && (
                  <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-400 text-sm">Select a document from the sidebar</p>
                  </div>
                )}

                {/* Reference links */}
                {savedLinks.length > 0 && (
                  <div>
                    <h2 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                      <span>🔗</span> External References
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedLinks.map(link => (
                        <ReferenceCard key={link._id} resource={link} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ResourcesAdminPage;
