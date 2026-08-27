import { useState } from 'react';
import api from '../api/client';

export const useCloudinary = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Upload single image
  const uploadSingle = async (file) => {
    console.log('useCloudinary.uploadSingle called with:', file ? file.name : 'No file');
    
    if (!file) {
      console.error('No file provided to uploadSingle');
      throw new Error('No file provided');
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file to Cloudinary via backend...');

      const response = await api.post('/upload/single', formData, {
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

      console.log('Upload response:', response.data);

      if (response.data && response.data.success && response.data.data) {
        return response.data.data; // { url, public_id, ... }
      } else {
        throw new Error('Upload failed: Invalid response format');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || err.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Upload multiple images
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

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Upload failed: Invalid response format');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || err.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadSingle,    
    uploadMultiple,
    uploading,
    progress,
    error,
    reset,
  };
};