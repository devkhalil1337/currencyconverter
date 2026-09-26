export type ShareResult = 'shared' | 'unavailable';

/** On web there is no share sheet for files, so download the CSV instead. */
export async function shareCsv(fileName: string, csv: string, _dialogTitle: string): Promise<ShareResult> {
  if (typeof document === 'undefined') return 'unavailable';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Revoking right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'shared';
}
