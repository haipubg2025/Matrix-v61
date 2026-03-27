import { idbService, STORES } from "./idbService";
import imageCompression from 'browser-image-compression';

export const uploadImage = async (file: File, _userId?: string): Promise<string> => {
  // userId is ignored as we are local-only
  // Compression options
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };

  let fileToUpload = file;
  try {
    // Only compress if it's an image
    if (file.type.startsWith('image/')) {
      fileToUpload = await imageCompression(file, options);
    }
  } catch (error) {
    console.warn('Compression failed, using original file:', error);
    fileToUpload = file;
  }

  // Local storage only
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      const imageId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        await idbService.set(STORES.IMAGES, imageId, {
          id: imageId,
          data: base64data,
          timestamp: Date.now(),
          type: file.type,
          name: file.name
        });
        resolve(imageId);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileToUpload);
  });
};

export const uploadImageFromUrl = async (url: string, _userId?: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], "downloaded_image.png", { type: blob.type });
    return uploadImage(file, _userId);
  } catch (error) {
    console.error('Error uploading from URL:', error);
    return url; // Fallback to original URL
  }
};

export const fetchUserImages = async (_userId?: string): Promise<any[]> => {
  try {
    const images = await idbService.getAll(STORES.IMAGES);
    return images.map(img => ({
      id: img.id,
      url: img.data,
      name: img.name,
      timestamp: img.timestamp
    }));
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
};

export const deleteImageFromCloud = async (imageUrl: string, _userId?: string): Promise<void> => {
  // Redirect to local delete
  return deleteImage(imageUrl);
};

export const checkSystemHealth = async (): Promise<boolean> => {
  return true; // Local storage is always "healthy" if the app is running
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  if (imageUrl.startsWith('local_')) {
    await idbService.delete(STORES.IMAGES, imageUrl);
  }
};

export const getImageUrl = async (imageId: string): Promise<string> => {
  if (imageId.startsWith('data:image')) return imageId;
  if (imageId.startsWith('http')) return imageId;
  
  try {
    const imgData = await idbService.get(STORES.IMAGES, imageId);
    return imgData?.data || '';
  } catch (err) {
    console.error('Error fetching local image:', err);
    return '';
  }
};
