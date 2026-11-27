import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Megaphone, Plus } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

export function NoticesAndMaterialsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const canUploadMaterial = isAdmin || user?.role === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [noticeModal, setNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', targetRole: 'all', isPinned: false });

  const [matModal, setMatModal] = useState(false);
  const [matForm, setMatForm] = useState({ title: '', description: '', batchId: '', subjectId: '', resourceUrl: '', resourceType: 'pdf' });

  const loadData = useCallback(async () => {
    const [aRes, mRes] = await Promise.all([
      axiosClient.get('/announcements'),
      axiosClient.get('/materials'),
    ]);
    setAnnouncements(aRes.data?.data?.announcements || []);
    setMaterials(mRes.data?.data?.materials || []);

    if (canUploadMaterial) {
      const [bRes, sRes] = await Promise.all([
        axiosClient.get('/batches'),
        axiosClient.get('/subjects'),
      ]);
      setBatches(bRes.data?.data?.batches || []);
      setSubjects(sRes.data?.data?.subjects || []);
    }
  }, [canUploadMaterial]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handlePublishNotice(e) {
    e.preventDefault();
    await axiosClient.post('/announcements', noticeForm);
    setNoticeModal(false);
    setNoticeForm({ title: '', content: '', targetRole: 'all', isPinned: false });
    loadData();
  }

  async function handleAddMaterial(e) {
    e.preventDefault();
    await axiosClient.post('/materials', matForm);
    setMatModal(false);
    setMatForm({ title: '', description: '', batchId: '', subjectId: '', resourceUrl: '', resourceType: 'pdf' });
    loadData();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notices &amp; Learning Materials</h1>
          <p className="mt-1 text-sm text-slate-500">
            Campus announcements and course-specific study resources.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => setNoticeModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Post Notice
            </button>
          )}
          {canUploadMaterial && (
            <button onClick={() => setMatModal(true)} className="btn-secondary">
              <Plus className="h-4 w-4" /> Add Study Material
            </button>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-brand-600" />
          <h2 className="text-base font-semibold text-slate-900">Campus Announcements</h2>
        </div>
        {announcements.length === 0 ? (
          <div className="card-surface p-6 text-sm text-slate-500">No announcements posted yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {announcements.map((a) => (
              <div key={a._id} className="card-surface p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <StatusBadge label={a.targetRole} variant={a.isPinned ? 'warning' : 'info'} />
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line">{a.content}</p>
                <p className="text-xs text-slate-400">
                  Posted by {a.authorId?.fullName || 'Admin'} &bull; {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learning Materials */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-slate-900">Learning Materials</h2>
        </div>
        {materials.length === 0 ? (
          <div className="card-surface p-6 text-sm text-slate-500">No learning materials shared yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <div key={m._id} className="card-surface p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-brand-700">{m.batchId?.batchCode}</span>
                    <StatusBadge label={m.resourceType.toUpperCase()} variant="neutral" />
                  </div>
                  <h3 className="mt-2 font-semibold text-slate-900">{m.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{m.subjectId?.title}</p>
                  {m.description && <p className="mt-2 text-sm text-slate-600">{m.description}</p>}
                </div>
                <a
                  href={m.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  Open Resource <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={noticeModal} onClose={() => setNoticeModal(false)} title="Publish Announcement">
        <form onSubmit={handlePublishNotice} className="space-y-3">
          <input type="text" required placeholder="Notice Title" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} className="input-field" />
          <textarea required rows={4} placeholder="Announcement details..." value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} className="input-field" />
          <select value={noticeForm.targetRole} onChange={(e) => setNoticeForm({ ...noticeForm, targetRole: e.target.value })} className="input-field">
            <option value="all">All Campus Users</option>
            <option value="students">Students Only</option>
            <option value="teachers">Teachers Only</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setNoticeModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Publish</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={matModal} onClose={() => setMatModal(false)} title="Share Learning Material">
        <form onSubmit={handleAddMaterial} className="space-y-3">
          <input type="text" required placeholder="Material Title" value={matForm.title} onChange={(e) => setMatForm({ ...matForm, title: e.target.value })} className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <select required value={matForm.batchId} onChange={(e) => setMatForm({ ...matForm, batchId: e.target.value })} className="input-field">
              <option value="">Select Batch</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.batchCode}</option>)}
            </select>
            <select required value={matForm.subjectId} onChange={(e) => setMatForm({ ...matForm, subjectId: e.target.value })} className="input-field">
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
            </select>
          </div>
          <input type="url" required placeholder="Resource URL (https://...)" value={matForm.resourceUrl} onChange={(e) => setMatForm({ ...matForm, resourceUrl: e.target.value })} className="input-field" />
          <select value={matForm.resourceType} onChange={(e) => setMatForm({ ...matForm, resourceType: e.target.value })} className="input-field">
            <option value="pdf">PDF Document</option>
            <option value="slides">Presentation Slides</option>
            <option value="code">Code Repository</option>
            <option value="link">Web Resource</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setMatModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Share Material</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
