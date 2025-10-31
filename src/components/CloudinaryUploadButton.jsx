// src/components/CloudinaryUploadButton.jsx
import React, { useRef, useState } from 'react';
import { Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export default function CloudinaryUploadButton({ onUploaded, children, size = 'small' }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const choose = () => inputRef.current?.click();

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      onUploaded?.(url);
      message.success('Image uploaded');
    } catch (err) {
      console.error(err);
      message.error('Upload failed');
    } finally {
      setLoading(false);
      e.target.value = ''; // reset so same file can re-trigger
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        hidden
        ref={inputRef}
        onChange={handleChange}
      />
      <Button icon={<UploadOutlined />} loading={loading} size={size} onClick={choose}>
        {children ?? 'Upload Image'}
      </Button>
    </>
  );
}
