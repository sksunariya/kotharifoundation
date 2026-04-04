import { useState, useEffect, useRef, useCallback } from 'react';
import { resourceAPI } from '../api/endpoints';
import toast from 'react-hot-toast';


// ─── DropZone ────────────────────────────────────────────────────────────────

const DropZone = ({ accept, label, icon, onFiles }) => {
  const [over, setOver] = useState(false);
  const inputRef = useRef();

  const handle = (files) => {
    const valid = Array.from(files).filter(
      (f) => f.type.startsWith(accept === 'video' ? 'video/' : 'application/pdf')
    );
    if (valid.length === 0) { toast.error(`Only ${label} files are accepted.`); return; }
    onFiles(valid);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current.click()}
      className={`border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors select-none
        ${over ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
    >
      <div className="text-3xl mb-1">{icon}</div>
      <p className="text-sm font-medium text-gray-600">
        Drag & drop {label} here
      </p>
      <p className="text-xs text-gray-400 mt-0.5">or <span className="text-primary-600 font-medium">browse files</span></p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept === 'video' ? 'video/*' : 'application/pdf'}
        multiple
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
};

// ─── UploadRow — shows progress while uploading ───────────────────────────────

const UploadRow = ({ item, onRetry }) => (
  <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
    <span className="text-lg flex-shrink-0">{item.type === 'video' ? '🎬' : '📄'}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
      {item.status === 'uploading' && (
        <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-200"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
    <span className="flex-shrink-0 text-xs font-semibold flex items-center gap-1.5">
      {item.status === 'uploading' && <span className="text-primary-600">{item.progress}%</span>}
      {item.status === 'done'     && <span className="text-green-600">✓ Saved</span>}
      {item.status === 'error'    && (
        <>
          <span className="text-red-500">✗ Failed</span>
          <button
            onClick={onRetry}
            className="text-gray-400 hover:text-primary-600 transition-colors"
            title="Retry upload"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </>
      )}
    </span>
  </div>
);

// ─── SavedRow — existing resource, deletable ─────────────────────────────────

const SavedRow = ({ item, onDelete }) => (
  <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 group">
    <span className="text-lg flex-shrink-0">{item.type === 'video' ? '🎬' : item.type === 'pdf' ? '📄' : '🔗'}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-700 truncate">
        {item.title}
        {item.isRecording && (
          <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Recording</span>
        )}
      </p>
      {item.s3Key && <p className="text-xs text-gray-400 font-mono truncate">{item.s3Key}</p>}
      {item.url && <p className="text-xs text-primary-500 truncate">{item.url}</p>}
    </div>
    <button
      onClick={() => onDelete(item._id)}
      className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
      title="Remove"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ icon, label, count, children, action }) => (
  <div className="border border-gray-100 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="font-semibold text-gray-700 text-sm">{label}</span>
        {count > 0 && (
          <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {action}
    </div>
    <div className="p-3 space-y-1.5">{children}</div>
  </div>
);

// ─── Main modal ───────────────────────────────────────────────────────────────

/**
 * slot: { _id, title, startTime }
 */
const ResourceModal = ({ slot, onClose }) => {
  const [savedVideos, setSavedVideos] = useState([]);
  const [savedPdfs,   setSavedPdfs]   = useState([]);
  const [savedLinks,  setSavedLinks]  = useState([]);
  const [uploading,   setUploading]   = useState([]); // in-flight upload rows
  const [loading,     setLoading]     = useState(true);

  // Link form rows
  const [pendingLinks, setPendingLinks] = useState([]);

  // Dropzone visibility
  const [showVideoZone, setShowVideoZone] = useState(false);
  const [showPdfZone,   setShowPdfZone]   = useState(false);

  // ── Load existing resources on open ──
  useEffect(() => {
    resourceAPI.getAdminForSlot(slot._id)
      .then(res => {
        const all = res.data.resources;
        setSavedVideos(all.filter(r => r.type === 'video'));
        setSavedPdfs(all.filter(r => r.type === 'pdf'));
        setSavedLinks(all.filter(r => r.type === 'link'));
      })
      .catch(() => toast.error('Could not load existing resources.'))
      .finally(() => setLoading(false));
  }, [slot._id]);

  // ── Soft-delete a saved resource ──
  const handleDelete = async (id) => {
    if (!confirm('Remove this resource?')) return;
    try {
      await resourceAPI.delete(id);
      setSavedVideos(v => v.filter(r => r._id !== id));
      setSavedPdfs(p => p.filter(r => r._id !== id));
      setSavedLinks(l => l.filter(r => r._id !== id));
      toast.success('Removed.');
    } catch {
      toast.error('Remove failed.');
    }
  };

  // ── Upload a batch of files ──
  const handleFiles = useCallback(async (files, type) => {
    const existingCount = type === 'video' ? savedVideos.length : savedPdfs.length;

    // Build queue entries immediately so the user sees progress rows
    const entries = files.map((file, i) => {
      const index = existingCount + i;
      const title = type === 'video'
        ? (index === 0 && savedVideos.length === 0 ? 'Session Recording' : `Supplementary Video ${index + 1}`)
        : `Notes / PDF ${index + 1}`;
      return { _tempId: crypto.randomUUID(), file, type, title, progress: 0, status: 'uploading' };
    });

    setUploading(prev => [...prev, ...entries]);
    if (type === 'video') setShowVideoZone(false);
    if (type === 'pdf')   setShowPdfZone(false);

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
          setUploading(prev =>
            prev.map(e => e._tempId === entry._tempId ? { ...e, progress: pct } : e)
          );
        });

        setUploading(prev => prev.map(e =>
          e._tempId === entry._tempId ? { ...e, status: 'done' } : e
        ));
        if (type === 'video') setSavedVideos(prev => [...prev, data.resource]);
        else                  setSavedPdfs(prev => [...prev, data.resource]);

        setTimeout(() => {
          setUploading(prev => prev.filter(e => e._tempId !== entry._tempId));
        }, 1800);

      } catch {
        setUploading(prev => prev.map(e =>
          e._tempId === entry._tempId ? { ...e, status: 'error' } : e
        ));
        toast.error(`Upload failed: ${entry.file.name}`);
      }
    }
  }, [slot, savedVideos.length, savedPdfs.length]);

  // ── Retry a failed upload ──
  const handleRetry = useCallback(async (tempId) => {
    const entry = uploading.find(e => e._tempId === tempId);
    if (!entry) return;

    setUploading(prev => prev.map(e =>
      e._tempId === tempId ? { ...e, status: 'uploading', progress: 0 } : e
    ));

    try {
      const isRecording = entry.type === 'video' && savedVideos.length === 0;
      const formData = new FormData();
      formData.append('file', entry.file);
      formData.append('slotId', slot._id);
      formData.append('type', entry.type);
      formData.append('title', entry.title);
      formData.append('isRecording', String(isRecording));

      const { data } = await resourceAPI.uploadFile(formData, (pct) => {
        setUploading(prev =>
          prev.map(e => e._tempId === tempId ? { ...e, progress: pct } : e)
        );
      });

      setUploading(prev => prev.map(e =>
        e._tempId === tempId ? { ...e, status: 'done' } : e
      ));
      if (entry.type === 'video') setSavedVideos(prev => [...prev, data.resource]);
      else                        setSavedPdfs(prev => [...prev, data.resource]);

      setTimeout(() => {
        setUploading(prev => prev.filter(e => e._tempId !== tempId));
      }, 1800);
    } catch {
      setUploading(prev => prev.map(e =>
        e._tempId === tempId ? { ...e, status: 'error' } : e
      ));
      toast.error(`Upload failed: ${entry.file.name}`);
    }
  }, [uploading, slot._id, savedVideos.length]);

  // ── Add a blank link row ──
  const addLinkRow = () =>
    setPendingLinks(prev => [...prev, { _tempId: crypto.randomUUID(), title: '', url: '' }]);

  const updateLinkRow = (id, field, val) =>
    setPendingLinks(prev => prev.map(l => l._tempId === id ? { ...l, [field]: val } : l));

  const removeLinkRow = (id) =>
    setPendingLinks(prev => prev.filter(l => l._tempId !== id));

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
  const totalCount = savedVideos.length + savedPdfs.length + savedLinks.length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-lg text-gray-800">Session Resources</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{slot.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 ml-4 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : (
          <div className="p-5 space-y-4">

            {/* ── Videos ── */}
            <Section
              icon="🎬"
              label="Videos"
              count={savedVideos.length + uploadingVideos.length}
              action={
                <button
                  onClick={() => setShowVideoZone(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span className="text-base leading-none">+</span> Add Video
                </button>
              }
            >
              {savedVideos.length === 0 && uploadingVideos.length === 0 && !showVideoZone && (
                <p className="text-xs text-gray-400 text-center py-3">No videos yet. Click <strong>+ Add Video</strong> to upload.</p>
              )}
              {savedVideos.map(v => <SavedRow key={v._id} item={v} onDelete={handleDelete} />)}
              {uploadingVideos.map(u => <UploadRow key={u._tempId} item={u} onRetry={() => handleRetry(u._tempId)} />)}
              {showVideoZone && (
                <DropZone
                  accept="video"
                  label="video"
                  icon="🎬"
                  onFiles={(files) => handleFiles(files, 'video')}
                />
              )}
            </Section>

            {/* ── PDFs ── */}
            <Section
              icon="📄"
              label="PDFs & Notes"
              count={savedPdfs.length + uploadingPdfs.length}
              action={
                <button
                  onClick={() => setShowPdfZone(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span className="text-base leading-none">+</span> Add PDF
                </button>
              }
            >
              {savedPdfs.length === 0 && uploadingPdfs.length === 0 && !showPdfZone && (
                <p className="text-xs text-gray-400 text-center py-3">No PDFs yet. Click <strong>+ Add PDF</strong> to upload.</p>
              )}
              {savedPdfs.map(p => <SavedRow key={p._id} item={p} onDelete={handleDelete} />)}
              {uploadingPdfs.map(u => <UploadRow key={u._tempId} item={u} onRetry={() => handleRetry(u._tempId)} />)}
              {showPdfZone && (
                <DropZone
                  accept="pdf"
                  label="PDF"
                  icon="📄"
                  onFiles={(files) => handleFiles(files, 'pdf')}
                />
              )}
            </Section>

            {/* ── Reference Links ── */}
            <Section
              icon="🔗"
              label="Reference Links"
              count={savedLinks.length}
              action={
                <button
                  onClick={addLinkRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span className="text-base leading-none">+</span> Add Link
                </button>
              }
            >
              {savedLinks.length === 0 && pendingLinks.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">No links yet. Click <strong>+ Add Link</strong> to add a reference.</p>
              )}
              {savedLinks.map(l => <SavedRow key={l._id} item={l} onDelete={handleDelete} />)}

              {/* Pending link rows */}
              {pendingLinks.map(row => (
                <div key={row._tempId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <span className="text-lg flex-shrink-0">🔗</span>
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
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </Section>

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            {totalCount} resource{totalCount !== 1 ? 's' : ''} saved for this session
          </p>
          <button onClick={onClose} className="btn-primary px-6">Done</button>
        </div>
      </div>
    </div>
  );
};

export default ResourceModal;
