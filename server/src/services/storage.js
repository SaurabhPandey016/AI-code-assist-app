import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

async function uploadToSupabase({ file, bucketName = process.env.SUPABASE_BUCKET_NAME || 'AI-code' }) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return {
      fileName: `${randomUUID()}.${file.originalname.split('.').pop() || 'txt'}`,
      publicUrl: '',
      originalName: file.originalname,
      uploaded: false,
    };
  }

  const extension = file.originalname.split('.').pop() || 'txt';
  const storedName = `${randomUUID()}.${extension}`;

  // Support both browser File-like objects and multer's buffer
  const fileBuffer = file.buffer ? file.buffer : Buffer.from(await (file.arrayBuffer ? file.arrayBuffer() : Buffer.from('')));

  const { error } = await supabase.storage.from(bucketName).upload(storedName, fileBuffer, {
    contentType: file.mimetype || 'application/octet-stream',
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || 'Failed to upload file.');
  }

  const { publicUrl } = supabase.storage.from(bucketName).getPublicUrl(storedName).data;

  return {
    fileName: storedName,
    publicUrl,
    originalName: file.originalname,
    uploaded: true,
  };
}

export { uploadToSupabase };
