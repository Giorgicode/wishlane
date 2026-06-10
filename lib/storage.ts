import { storage } from '@/config/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3 MB

export async function uploadImageAsync(uri: string, path: string) {
  const response = await fetch(uri);
  const blob = await response.blob();

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image is too large. Please choose one under 3 MB.');
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob as any);
  const url = await getDownloadURL(storageRef);
  return url;
}
