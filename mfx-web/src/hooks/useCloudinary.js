import { useState } from 'react';
import api from '../api/client';

export const useCloudinary = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadMultiple = async (files) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadMultiple,
    uploading,
    progress,
    error,
    reset: () => { setUploading(false); setProgress(0); setError(null); },
  };
};