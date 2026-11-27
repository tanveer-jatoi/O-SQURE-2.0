import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const GRADE_VARIANT = {
  Distinction: 'success',
  Credit: 'info',
  Pass: 'warning',
  Fail: 'danger',
};

export function StudentResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get('/results/my-results')
      .then((res) => setResults(res.data?.data?.results || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownloadPdf(examinationId, examCode) {
    const res = await axiosClient.get(`/results/my-results/${examinationId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Result-${examCode}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Published Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          View your official grades and download printable PDF result cards.
        </p>
      </div>

      <DataTable
        isLoading={loading}
        rows={results}
        columns={[
          { key: 'exam', header: 'Examination', render: (r) => r.examinationId?.title },
          { key: 'subject', header: 'Subject', render: (r) => r.examSubjectId?.subjectId?.title },
          { key: 'score', header: 'Score', render: (r) => (r.isAbsent ? 'ABS' : `${r.marksObtained} / ${r.examSubjectId?.totalMarks || 100}`) },
          { key: 'percentage', header: '%', render: (r) => `${r.percentage}%` },
          { key: 'grade', header: 'Grade', render: (r) => <StatusBadge label={r.grade} variant={GRADE_VARIANT[r.grade] || 'neutral'} /> },
          {
            key: 'pdf',
            header: 'Result Card',
            render: (r) => (
              <button
                onClick={() => handleDownloadPdf(r.examinationId._id, r.examinationId.examCode)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
            ),
          },
        ]}
        emptyIcon={FileSpreadsheet}
        emptyTitle="No published results yet"
        emptyDescription="Your result cards will appear here once examinations are published by administration."
      />
    </div>
  );
}
