import { useState } from 'react';
import { instructorAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const defaultForm = {
  name: '', title: '', shortBio: '', detailedBio: '', photo: '',
  expertise: '', experience: '', qualifications: '', achievements: '',
  sortOrder: 0, isActive: true,
  socialLinks: { linkedin: '', twitter: '', youtube: '', instagram: '', website: '' },
};

const parseLines = (str) => str.split('\n').map(s => s.trim()).filter(Boolean);
const joinLines = (arr) => (arr || []).join('\n');

const InstructorsAdminPage = () => {
  const { data, loading, refetch } = useFetch(() => instructorAPI.getAdminAll());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const instructors = data?.instructors || [];

  const openNew = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (ins) => {
    setForm({
      name: ins.name,
      title: ins.title,
      shortBio: ins.shortBio || '',
      detailedBio: ins.detailedBio || '',
      photo: ins.photo || '',
      expertise: (ins.expertise || []).join(', '),
      experience: ins.experience ?? '',
      qualifications: joinLines(ins.qualifications),
      achievements: joinLines(ins.achievements),
      sortOrder: ins.sortOrder ?? 0,
      isActive: ins.isActive,
      socialLinks: {
        linkedin: ins.socialLinks?.linkedin || '',
        twitter: ins.socialLinks?.twitter || '',
        youtube: ins.socialLinks?.youtube || '',
        instagram: ins.socialLinks?.instagram || '',
        website: ins.socialLinks?.website || '',
      },
    });
    setEditId(ins._id);
    setShowForm(true);
  };

  const buildPayload = () => ({
    name: form.name,
    title: form.title,
    shortBio: form.shortBio,
    detailedBio: form.detailedBio,
    photo: form.photo,
    expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
    experience: form.experience !== '' ? Number(form.experience) : undefined,
    qualifications: parseLines(form.qualifications),
    achievements: parseLines(form.achievements),
    sortOrder: Number(form.sortOrder),
    isActive: form.isActive,
    socialLinks: form.socialLinks,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await instructorAPI.update(editId, buildPayload());
        toast.success('Instructor updated.');
      } else {
        await instructorAPI.create(buildPayload());
        toast.success('Instructor created.');
      }
      setShowForm(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this instructor?')) return;
    try {
      await instructorAPI.delete(id);
      toast.success('Instructor deleted.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setSocial = (key, val) => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: val } }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Instructors</h1>
        <button onClick={openNew} className="btn-primary text-sm">+ Add Instructor</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-8">
          <h3 className="font-semibold text-gray-800 mb-5">{editId ? 'Edit' : 'New'} Instructor</h3>
          <form onSubmit={handleSave} className="space-y-6">

            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input className="input" value={form.name} onChange={e => setField('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title / Role <span className="text-red-500">*</span></label>
                <input className="input" placeholder="e.g. Senior Engineer at Google" value={form.title} onChange={e => setField('title', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                <input className="input" placeholder="https://..." value={form.photo} onChange={e => setField('photo', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input type="number" className="input" min={0} value={form.experience} onChange={e => setField('experience', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expertise <span className="text-xs text-gray-400">(comma-separated)</span></label>
                <input className="input" placeholder="DSA, System Design, FAANG Prep" value={form.expertise} onChange={e => setField('expertise', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" className="input" value={form.sortOrder} onChange={e => setField('sortOrder', e.target.value)} />
              </div>
            </div>

            {/* Bios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio <span className="text-xs text-gray-400">(shown on landing page)</span></label>
                <textarea className="input resize-none" rows={3} value={form.shortBio} onChange={e => setField('shortBio', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Bio <span className="text-xs text-gray-400">(shown on profile page)</span></label>
                <textarea className="input resize-none" rows={3} value={form.detailedBio} onChange={e => setField('detailedBio', e.target.value)} />
              </div>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications <span className="text-xs text-gray-400">(one per line)</span></label>
                <textarea className="input resize-none" rows={3} placeholder={"B.Tech IIT Delhi\nM.S. Stanford"} value={form.qualifications} onChange={e => setField('qualifications', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Achievements <span className="text-xs text-gray-400">(one per line)</span></label>
                <textarea className="input resize-none" rows={3} placeholder={"Ex-Google L5\n500+ students mentored"} value={form.achievements} onChange={e => setField('achievements', e.target.value)} />
              </div>
            </div>

            {/* Social links */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Social Links</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {['linkedin', 'twitter', 'youtube', 'instagram', 'website'].map(platform => (
                  <div key={platform}>
                    <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{platform}</label>
                    <input
                      type="url"
                      className="input"
                      placeholder={`https://${platform === 'website' ? 'yoursite.com' : `${platform}.com/...`}`}
                      value={form.socialLinks[platform]}
                      onChange={e => setSocial(platform, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="insActive" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} />
              <label htmlFor="insActive" className="text-sm text-gray-700">Active (visible on site)</label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Instructor'}</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? <LoadingSpinner /> : (
        <>
          {instructors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">👨‍🏫</div>
              <p>No instructors yet. Add your first instructor!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {instructors.map((ins) => (
                <div key={ins._id} className={`card sm:flex gap-4 items-start ${!ins.isActive ? 'opacity-60' : ''}`}>
                  {ins.photo ? (
                    <img src={ins.photo} alt={ins.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 mb-3 sm:mb-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600 flex-shrink-0 mb-3 sm:mb-0">
                      {ins.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{ins.name}</p>
                        <p className="text-sm text-primary-600">{ins.title}</p>
                        {ins.experience && <p className="text-xs text-gray-400">{ins.experience}+ yrs exp</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!ins.isActive && <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
                        <button onClick={() => openEdit(ins)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                        <button onClick={() => handleDelete(ins._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                      </div>
                    </div>
                    {ins.shortBio && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ins.shortBio}</p>}
                    {ins.expertise?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ins.expertise.map(tag => (
                          <span key={tag} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InstructorsAdminPage;
