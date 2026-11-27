import { useCallback, useEffect, useState } from 'react';
import { Calendar, FileSpreadsheet, Plus, CheckCircle2, EyeOff } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

export function ExaminationsPage() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examSubjects, setExamSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [examModal, setExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ title: '', courseId: '', term: 'final', startDate: '', endDate: '' });

  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ subjectId: '', examDate: '', startTime: '10:00', totalMarks: 100, passingMarks: 50 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, cRes, sRes] = await Promise.all([
        axiosClient.get('/examinations'),
        axiosClient.get('/courses'),
        axiosClient.get('/subjects'),
      ]);
      const list = eRes.data?.data?.examinations || [];
      setExams(list);
      setCourses(cRes.data?.data?.courses || []);
      setSubjects(sRes.data?.data?.subjects || []);
      if (list.length > 0 && !selectedExam) setSelectedExam(list[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  }, [selectedExam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedExam) return;
    axiosClient
      .get(`/examinations/${selectedExam._id}/subjects`)
      .then((res) => setExamSubjects(res.data?.data?.examSubjects || []));
  }, [selectedExam]);

  async function handleCreateExam(e) {
    e.preventDefault();
    setError('');
    try {
      await axiosClient.post('/examinations', examForm);
      setExamModal(false);
      setExamForm({ title: '', courseId: '', term: 'final', startDate: '', endDate: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to schedule examination.');
    }
  }

  async function handleAddSubject(e) {
    e.preventDefault();
    if (!selectedExam) return;
    try {
      await axiosClient.post(`/examinations/${selectedExam._id}/subjects`, subjectForm);
      setSubjectModal(false);
      const res = await axiosClient.get(`/examinations/${selectedExam._id}/subjects`);
      setExamSubjects(res.data?.data?.examSubjects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add subject paper.');
    }
  }

  async function handleTogglePublish(exam) {
    await axiosClient.patch(`/examinations/${exam._id}/publish`, {
      isPublished: !exam.isPublished,
    });
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Examinations &amp; Results</h1>
          <p className="mt-1 text-sm text-slate-500">
            Schedule exams, assign subject papers, and publish verified student results.
          </p>
        </div>
        <button onClick={() => setExamModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Schedule Examination
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DataTable
        isLoading={loading}
        rows={exams}
        columns={[
          { key: 'examCode', header: 'Code', render: (e) => <span className="font-mono text-xs font-semibold text-brand-700">{e.examCode}</span> },
          {
            key: 'title',
            header: 'Examination',
            render: (e) => (
              <button onClick={() => setSelectedExam(e)} className="text-left font-medium text-slate-900 hover:text-brand-600">
                {e.title}
              </button>
            ),
          },
          { key: 'course', header: 'Course', render: (e) => e.courseId?.courseCode },
          { key: 'term', header: 'Term', render: (e) => <StatusBadge label={e.term.toUpperCase()} variant="info" /> },
          {
            key: 'isPublished',
            header: 'Publication',
            render: (e) => (
              <StatusBadge label={e.isPublished ? 'Published' : 'Draft'} variant={e.isPublished ? 'success' : 'warning'} />
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (e) => (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTogglePublish(e)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  {e.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {e.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            ),
          },
        ]}
        emptyIcon={FileSpreadsheet}
        emptyTitle="No examinations scheduled"
        emptyDescription="Schedule an examination to begin assigning subject papers and marks."
      />

      {selectedExam && (
        <div className="card-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Subject Papers: {selectedExam.title}
              </h2>
              <p className="text-xs text-slate-500">{selectedExam.examCode}</p>
            </div>
            <button onClick={() => setSubjectModal(true)} className="btn-secondary text-xs">
              <Calendar className="h-4 w-4" />
              Add Subject Paper
            </button>
          </div>

          <DataTable
            rows={examSubjects}
            columns={[
              { key: 'subject', header: 'Subject', render: (s) => `${s.subjectId?.subjectCode} — ${s.subjectId?.title}` },
              { key: 'examDate', header: 'Exam Date', render: (s) => new Date(s.examDate).toLocaleDateString() },
              { key: 'startTime', header: 'Time' },
              { key: 'marks', header: 'Pass / Total', render: (s) => `${s.passingMarks} / ${s.totalMarks}` },
            ]}
            emptyTitle="No subject papers scheduled"
            emptyDescription="Add subject papers to allow teachers to enter marks."
          />
        </div>
      )}

      <Modal isOpen={examModal} onClose={() => setExamModal(false)} title="Schedule Examination">
        <form onSubmit={handleCreateExam} className="space-y-3">
          <input type="text" required placeholder="Examination Title" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <select required value={examForm.courseId} onChange={(e) => setExamForm({ ...examForm, courseId: e.target.value })} className="input-field">
              <option value="">Select Course</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.courseCode} — {c.title}</option>)}
            </select>
            <select value={examForm.term} onChange={(e) => setExamForm({ ...examForm, term: e.target.value })} className="input-field">
              <option value="quiz">Quiz</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="project">Project</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" required value={examForm.startDate} onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })} className="input-field" />
            <input type="date" required value={examForm.endDate} onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setExamModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Schedule</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={subjectModal} onClose={() => setSubjectModal(false)} title="Add Subject Paper">
        <form onSubmit={handleAddSubject} className="space-y-3">
          <select required value={subjectForm.subjectId} onChange={(e) => setSubjectForm({ ...subjectForm, subjectId: e.target.value })} className="input-field">
            <option value="">Select Subject</option>
            {subjects
              .filter((s) => s.courseId?._id === selectedExam?.courseId?._id)
              .map((s) => <option key={s._id} value={s._id}>{s.subjectCode} — {s.title}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" required value={subjectForm.examDate} onChange={(e) => setSubjectForm({ ...subjectForm, examDate: e.target.value })} className="input-field" />
            <input type="time" required value={subjectForm.startTime} onChange={(e) => setSubjectForm({ ...subjectForm, startTime: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" required min="10" placeholder="Total Marks" value={subjectForm.totalMarks} onChange={(e) => setSubjectForm({ ...subjectForm, totalMarks: e.target.value })} className="input-field" />
            <input type="number" required min="1" placeholder="Passing Marks" value={subjectForm.passingMarks} onChange={(e) => setSubjectForm({ ...subjectForm, passingMarks: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSubjectModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Paper</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
