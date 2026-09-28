import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://rnxuskcfwcpltmwvevpa.supabase.co';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueHVza2Nmd2NwbHRtd3ZldnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODExOTAsImV4cCI6MjEwNTg1NzE5MH0.t-dabyLg-XmrcomO63W5Tneo0INhDQlZB1-BzVbeWIo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage helper — uploads a file and returns its public URL.
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('row-level security') || msg.includes('violates') || msg.includes('policy')) {
      throw new Error('Your account does not have permission to upload files yet. Please ask your administrator to enable storage access.');
    }
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
