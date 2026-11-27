import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Building2, Layers, Plus, UserCheck } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

const TABS = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'subjects', label: 'Subjects', icon: Layers },
  { id: 'classes', label: 'Classrooms & Labs', icon: Building2 },
  { id: 'batches', label: 'Batches', icon: Layers },
  { id: 'enrollments', label: 'Enrollments', icon: UserCheck },
];

export function AcademicsPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classRooms, setClassRooms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalType, setModalType] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, sRes, rRes, bRes, tRes, stRes] = await Promise.all([
        axiosClient.get('/courses'),
        axiosClient.get('/subjects'),
        axiosClient.get('/classes'),
        axiosClient.get('/batches'),
        axiosClient.get('/teachers', { params: { limit: 100 } }),
        axiosClient.get('/students', { params: { limit: 100 } }),
      ]);
      setCourses(cRes.data?.data?.courses || []);
      setSubjects(sRes.data?.data?.subjects || []);
      setClassRooms(rRes.data?.data?.classRooms || []);
      const batchList = bRes.data?.data?.batches || [];
      setBatches(batchList);
      setTeachers(tRes.data?.data?.teachers || []);
      setStudents(stRes.data?.data?.students || []);
      if (batchList.length > 0 && !selectedBatchId) {
        setSelectedBatchId(batchList[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load academic records.');
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedBatchId) {
      setRoster([]);
      return;
    }
    axiosClient
      .get(`/batches/${selectedBatchId}/students`)
      .then((res) => setRoster(res.data?.data?.enrollments || []))
      .catch(() => setRoster([]));
  }, [selectedBatchId]);

  function openModal(type, defaults = {}) {
    setFormError('');
    setForm(defaults);
    setModalType(type);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const endpointMap = {
        courses: '/courses',
        subjects: '/subjects',
        classes: '/classes',
        batches: '/batches',
        enrollments: '/enrollments',
      };
      await axiosClient.post(endpointMap[modalType], form);
      setModalType(null);
      await loadAll();
      if (modalType === 'enrollments' && form.batchId) {
        setSelectedBatchId(form.batchId);
      }
    } catch (err) {
      const details = err.response?.data?.details;
      setFormError(
        details?.map((d) => d.message).join(' • ') ||
          err.response?.data?.message ||
          'Operation failed.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Structure</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure courses, subjects, classrooms, conflict-checked batches, and student enrollments.
          </p>
        </div>
        <button
          onClick={() => openModal(activeTab)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add {TABS.find((t) => t.id === activeTab)?.label.replace(/s$/, '')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'courses' && (
        <DataTable
          isLoading={loading}
          rows={courses}
          columns={[
            { key: 'courseCode', header: 'Code', render: (c) => <span className="font-mono text-xs font-semibold text-brand-700">{c.courseCode}</span> },
            { key: 'title', header: 'Course Title', render: (c) => <span className="font-medium text-slate-900">{c.title}</span> },
            { key: 'totalSemesters', header: 'Semesters' },
            { key: 'durationMonths', header: 'Duration (Mos)' },
            { key: 'baseFee', header: 'Base Fee (PKR)', render: (c) => c.baseFee.toLocaleString() },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge label={c.status} variant="success" /> },
          ]}
          emptyTitle="No courses configured"
          emptyDescription="Create your first diploma or certificate program."
        />
      )}

      {activeTab === 'subjects' && (
        <DataTable
          isLoading={loading}
          rows={subjects}
          columns={[
            { key: 'subjectCode', header: 'Code', render: (s) => <span className="font-mono text-xs font-semibold text-brand-700">{s.subjectCode}</span> },
            { key: 'title', header: 'Subject Title', render: (s) => <span className="font-medium text-slate-900">{s.title}</span> },
            { key: 'course', header: 'Course', render: (s) => s.courseId?.courseCode || '—' },
            { key: 'semester', header: 'Semester' },
            { key: 'creditHours', header: 'Credits' },
            { key: 'marks', header: 'Pass / Total', render: (s) => `${s.passingMarks} / ${s.totalMarks}` },
          ]}
          emptyTitle="No subjects added"
          emptyDescription="Add subjects linked to your courses."
        />
      )}

      {activeTab === 'classes' && (
        <DataTable
          isLoading={loading}
          rows={classRooms}
          columns={[
            { key: 'roomName', header: 'Room / Lab Name', render: (r) => <span className="font-medium text-slate-900">{r.roomName}</span> },
            { key: 'roomType', header: 'Type', render: (r) => <StatusBadge label={r.roomType.replace('_', ' ')} variant="info" /> },
            { key: 'capacity', header: 'Capacity' },
          ]}
          emptyTitle="No classrooms configured"
          emptyDescription="Add theory rooms and computer labs for batch scheduling."
        />
      )}

      {activeTab === 'batches' && (
        <DataTable
          isLoading={loading}
          rows={batches}
          columns={[
            { key: 'batchCode', header: 'Batch Code', render: (b) => <span className="font-mono text-xs font-semibold text-brand-700">{b.batchCode}</span> },
            { key: 'course', header: 'Course', render: (b) => b.courseId?.courseCode || '—' },
            { key: 'teacher', header: 'Faculty', render: (b) => b.assignedTeacherId?.fullName || '—' },
            { key: 'room', header: 'Room', render: (b) => b.classRoomId?.roomName || '—' },
            { key: 'schedule', header: 'Schedule', render: (b) => `${b.daysPattern} (${b.startTime}–${b.endTime})` },
            { key: 'status', header: 'Status', render: (b) => <StatusBadge label={b.status.replace('_', ' ')} variant="info" /> },
          ]}
          emptyTitle="No batches created"
          emptyDescription="Create a batch to link a course, classroom, and faculty member."
        />
      )}

      {activeTab === 'enrollments' && (
        <div className="space-y-4">
          <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Batch Roster:</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="input-field w-64 py-2"
              >
                <option value="">Select a Batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.batchCode} — {b.courseId?.courseCode}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {roster.length} active student(s)
            </span>
          </div>

          <DataTable
            rows={roster}
            columns={[
              { key: 'studentId', header: 'Student ID', render: (e) => <span className="font-mono text-xs font-semibold text-brand-700">{e.studentId?.studentId}</span> },
              { key: 'fullName', header: 'Student Name', render: (e) => e.studentId?.fullName },
              { key: 'contactPhone', header: 'Phone', render: (e) => e.studentId?.contactPhone },
              { key: 'status', header: 'Enrollment', render: (e) => <StatusBadge label={e.status} variant="success" /> },
            ]}
            emptyTitle="No students enrolled in this batch"
            emptyDescription="Click Add Enrollment to assign a student to a batch."
          />
        </div>
      )}

      {/* Dynamic Modal */}
      <Modal
        isOpen={Boolean(modalType)}
        onClose={() => setModalType(null)}
        title={`Create ${modalType ? modalType.replace(/s$/, '') : ''}`}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </div>
          )}

          {modalType === 'courses' && (
            <>
              <input type="text" required placeholder="Course Code (e.g. SE-DIP)" value={form.courseCode || ''} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} className="input-field" />
              <input type="text" required placeholder="Course Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" required min="1" placeholder="Semesters" value={form.totalSemesters || ''} onChange={(e) => setForm({ ...form, totalSemesters: e.target.value })} className="input-field" />
                <input type="number" required min="1" placeholder="Months" value={form.durationMonths || ''} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} className="input-field" />
                <input type="number" required min="0" placeholder="Monthly Fee" value={form.baseFee || ''} onChange={(e) => setForm({ ...form, baseFee: e.target.value })} className="input-field" />
              </div>
            </>
          )}

          {modalType === 'subjects' && (
            <>
              <select required value={form.courseId || ''} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="input-field">
                <option value="">Select Course</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.courseCode} — {c.title}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="Subject Code" value={form.subjectCode || ''} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })} className="input-field" />
                <input type="text" required placeholder="Subject Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required min="1" placeholder="Semester" value={form.semester || ''} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="input-field" />
                <input type="number" required min="1" placeholder="Credit Hours" value={form.creditHours || ''} onChange={(e) => setForm({ ...form, creditHours: e.target.value })} className="input-field" />
              </div>
            </>
          )}

          {modalType === 'classes' && (
            <>
              <input type="text" required placeholder="Room Name (e.g. Lab 2)" value={form.roomName || ''} onChange={(e) => setForm({ ...form, roomName: e.target.value })} className="input-field" />
              <div className="grid grid-cols-2 gap-2">
                <select required value={form.roomType || 'computer_lab'} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="input-field">
                  <option value="computer_lab">Computer Lab</option>
                  <option value="theory_room">Theory Room</option>
                </select>
                <input type="number" required min="5" placeholder="Capacity" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" />
              </div>
            </>
          )}

          {modalType === 'batches' && (
            <>
              <input type="text" required placeholder="Batch Code (e.g. 2026-M1)" value={form.batchCode || ''} onChange={(e) => setForm({ ...form, batchCode: e.target.value })} className="input-field" />
              <select required value={form.courseId || ''} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="input-field">
                <option value="">Select Course</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.courseCode} — {c.title}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select required value={form.classRoomId || ''} onChange={(e) => setForm({ ...form, classRoomId: e.target.value })} className="input-field">
                  <option value="">Select Classroom</option>
                  {classRooms.map((r) => <option key={r._id} value={r._id}>{r.roomName}</option>)}
                </select>
                <select required value={form.assignedTeacherId || ''} onChange={(e) => setForm({ ...form, assignedTeacherId: e.target.value })} className="input-field">
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select required value={form.daysPattern || 'MWF'} onChange={(e) => setForm({ ...form, daysPattern: e.target.value })} className="input-field">
                  <option value="MWF">MWF</option>
                  <option value="TTS">TTS</option>
                  <option value="DAILY">DAILY</option>
                  <option value="WEEKEND">WEEKEND</option>
                </select>
                <input type="time" required value={form.startTime || '09:00'} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
                <input type="time" required value={form.endTime || '11:00'} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" required value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
                <input type="date" required value={form.expectedEndDate || ''} onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })} className="input-field" />
              </div>
            </>
          )}

          {modalType === 'enrollments' && (
            <>
              <select required value={form.batchId || ''} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="input-field">
                <option value="">Select Target Batch</option>
                {batches.map((b) => <option key={b._id} value={b._id}>{b.batchCode} — {b.courseId?.courseCode}</option>)}
              </select>
              <select required value={form.studentId || ''} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="input-field">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.studentId} — {s.fullName}</option>)}
              </select>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalType(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
