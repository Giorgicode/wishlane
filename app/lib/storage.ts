import { storage } from '@/config/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

// Upload image using fetch -> blob (works in Expo)
export async function uploadImageAsync(uri: string, path: string) {
  // fetch the file
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob as any);
  const url = await getDownloadURL(storageRef);
  return url;
}
