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
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage.from(bucketName).upload(storedName, fileBuffer, {
    contentType: file.mimetype,
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
