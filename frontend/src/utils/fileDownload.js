import { axiosClient } from '../api/axiosClient.js';

/**
 * Fetches a protected PDF/Excel endpoint using the authenticated Axios client
 * and either downloads it or opens it in a printable browser tab.
 */
export async function fetchAndOpenPdf(endpoint, filename, mode = 'download') {
  const res = await axiosClient.get(endpoint, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(
    new Blob([res.data], { type: 'application/pdf' })
  );

  if (mode === 'print') {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Downloads any binary report (Excel .xlsx or PDF) from a protected API endpoint.
 */
export async function fetchAndDownloadReport(endpoint, filename) {
  const res = await axiosClient.get(endpoint, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
