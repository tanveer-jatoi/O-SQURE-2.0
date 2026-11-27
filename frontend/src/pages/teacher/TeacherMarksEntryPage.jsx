import { useEffect, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';

export function TeacherMarksEntryPage() {
  const [batches, setBatches] = useState([]);
  const [exams, setExams] = useState([]);
  const [examSubjects, setExamSubjects] = useState([]);
  const [roster, setRoster] = useState([]);

  const [batchId, setBatchId] = useState('');
  const [examId, setExamId] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [marksMap, setMarksMap] = useState({});
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([axiosClient.get('/batches'), axiosClient.get('/examinations')]).then(
      ([bRes, eRes]) => {
        setBatches(bRes.data?.data?.batches || []);
        setExams(eRes.data?.data?.examinations || []);
      }
    );
  }, []);

  useEffect(() => {
    if (!examId) {
      setExamSubjects([]);
      return;
    }
    axiosClient.get(`/examinations/${examId}/subjects`).then((res) => {
      setExamSubjects(res.data?.data?.examSubjects || []);
    });
  }, [examId]);

  useEffect(() => {
    if (!batchId) {
      setRoster([]);
      return;
    }
    axiosClient.get(`/batches/${batchId}/students`).then((res) => {
      const enrollments = res.data?.data?.enrollments || [];
      setRoster(enrollments);
      const init = {};
      enrollments.forEach((enr) => {
        init[enr.studentId._id] = { marksObtained: '', isAbsent: false };
      });
      setMarksMap(init);
    });
  }, [batchId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg('');
    setError('');
    setSaving(true);
    try {
      const entries = roster.map((enr) => {
        const val = marksMap[enr.studentId._id] || {};
        return {
          studentId: enr.studentId._id,
          marksObtained: val.isAbsent ? 0 : Number(val.marksObtained || 0),
          isAbsent: Boolean(val.isAbsent),
        };
      });

      const res = await axiosClient.post('/results/marks', {
        examSubjectId,
        batchId,
        entries,
      });
      setStatusMsg(res.data?.message || 'Marks saved!');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save marks.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marks Entry Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Record subject-wise scores for your assigned batches. Grades are calculated automatically.
        </p>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card-surface grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Assigned Batch</label>
          <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="input-field">
            <option value="">Select Batch</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.batchCode} — {b.courseId?.courseCode}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Examination</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="input-field">
            <option value="">Select Exam</option>
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>{ex.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Subject Paper</label>
          <select value={examSubjectId} onChange={(e) => setExamSubjectId(e.target.value)} className="input-field">
            <option value="">Select Subject</option>
            {examSubjects.map((es) => (
              <option key={es._id} value={es._id}>
                {es.subjectId?.title} (Max: {es.totalMarks})
              </option>
            ))}
          </select>
        </div>
      </div>

      {roster.length > 0 && examSubjectId && (
        <form onSubmit={handleSubmit} className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Marks Obtained</th>
                  <th className="px-4 py-3">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {roster.map((enr) => {
                  const sid = enr.studentId._id;
                  const entry = marksMap[sid] || { marksObtained: '', isAbsent: false };
                  return (
                    <tr key={sid}>
                      <td className="px-4 py-3 font-mono text-xs">{enr.studentId.studentId}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{enr.studentId.fullName}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          disabled={entry.isAbsent}
                          value={entry.isAbsent ? 0 : entry.marksObtained}
                          onChange={(e) =>
                            setMarksMap({
                              ...marksMap,
                              [sid]: { ...entry, marksObtained: e.target.value },
                            })
                          }
                          className="input-field w-32 py-1.5"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={entry.isAbsent}
                          onChange={(e) =>
                            setMarksMap({
                              ...marksMap,
                              [sid]: { ...entry, isAbsent: e.target.checked },
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-brand-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save & Calculate Grades'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
