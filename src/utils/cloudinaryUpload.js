// src/utils/cloudinaryUpload.js
export async function uploadToCloudinary(file) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error('Cloudinary env vars missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const json = await res.json();

  // Use secure_url; for delivery-time optimization you can add /q_auto,f_auto later
  return json.secure_url;
}
