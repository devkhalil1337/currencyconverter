import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ShareResult = 'shared' | 'unavailable';

/** Writes `csv` to the cache directory and opens the share sheet for it. */
export async function shareCsv(fileName: string, csv: string, dialogTitle: string): Promise<ShareResult> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle,
  });
  return 'shared';
}
