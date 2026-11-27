import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

export function TimetablePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [slots, setSlots] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classRooms, setClassRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    batchId: '',
    courseId: '',
    subjectId: '',
    teacherId: '',
    classRoomId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
  });
  const [formError, setFormError] = useState('');

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/timetable');
      setSlots(res.data?.data?.slots || []);
      if (isAdmin) {
        const [bRes, sRes, tRes, rRes] = await Promise.all([
          axiosClient.get('/batches'),
          axiosClient.get('/subjects'),
          axiosClient.get('/teachers', { params: { limit: 100 } }),
          axiosClient.get('/classes'),
        ]);
        setBatches(bRes.data?.data?.batches || []);
        setSubjects(sRes.data?.data?.subjects || []);
        setTeachers(tRes.data?.data?.teachers || []);
        setClassRooms(rRes.data?.data?.classRooms || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  async function handleCreateSlot(e) {
    e.preventDefault();
    setFormError('');
    try {
      await axiosClient.post('/timetable', form);
      setModalOpen(false);
      loadTimetable();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Schedule conflict or invalid slot.');
    }
  }

  async function handleDeleteSlot(id) {
    await axiosClient.delete(`/timetable/${id}`);
    loadTimetable();
  }

  const columns = [
    { key: 'dayOfWeek', header: 'Day', render: (s) => <StatusBadge label={s.dayOfWeek} variant="info" /> },
    { key: 'time', header: 'Time', render: (s) => `${s.startTime} – ${s.endTime}` },
    { key: 'batch', header: 'Batch', render: (s) => <span className="font-mono text-xs font-semibold text-brand-700">{s.batchId?.batchCode}</span> },
    { key: 'subject', header: 'Subject', render: (s) => s.subjectId?.title },
    { key: 'teacher', header: 'Faculty', render: (s) => s.teacherId?.fullName },
    { key: 'room', header: 'Room', render: (s) => s.classRoomId?.roomName },
  ];

  if (isAdmin) {
    columns.push({
      key: 'actions',
      header: 'Remove',
      render: (s) => (
        <button onClick={() => handleDeleteSlot(s._id)} className="text-rose-600 hover:text-rose-800">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly Timetable</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Manage weekly class schedules with automatic teacher and room conflict protection.'
              : 'Your personalized weekly class schedule.'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Timetable Slot
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DataTable
        isLoading={loading}
        rows={slots}
        columns={columns}
        emptyIcon={CalendarDays}
        emptyTitle="No timetable slots scheduled"
        emptyDescription="Scheduled classes for your batches will appear here."
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Timetable Slot">
        <form onSubmit={handleCreateSlot} className="space-y-3">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </div>
          )}
          <select
            required
            value={form.batchId}
            onChange={(e) => {
              const b = batches.find((x) => x._id === e.target.value);
              setForm({
                ...form,
                batchId: e.target.value,
                courseId: b?.courseId?._id || '',
                teacherId: b?.assignedTeacherId?._id || form.teacherId,
                classRoomId: b?.classRoomId?._id || form.classRoomId,
              });
            }}
            className="input-field"
          >
            <option value="">Select Batch</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.batchCode} — {b.courseId?.courseCode}</option>)}
          </select>
          <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input-field">
            <option value="">Select Subject</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode} — {s.title}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input-field">
              <option value="">Select Teacher</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
            </select>
            <select required value={form.classRoomId} onChange={(e) => setForm({ ...form, classRoomId: e.target.value })} className="input-field">
              <option value="">Select Room</option>
              {classRooms.map((r) => <option key={r._id} value={r._id}>{r.roomName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="input-field">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
            <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Slot</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
