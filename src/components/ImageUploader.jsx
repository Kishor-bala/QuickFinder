import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function ImageUploader({ images, setImages, maxFiles = 5, maxSizeBytes = 5 * 1024 * 1024 }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  const validateAndAddFiles = (newFiles) => {
    setError('');
    const validFiles = [];

    if (images.length + newFiles.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} images.`);
      return;
    }

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid format: "${file.name}". Only JPG, PNG, and WEBP are supported.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" exceeds maximum allowed size of 5MB.`);
        return;
      }

      // Add preview URL
      validFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
      });
    }

    setImages((prev) => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-brand-500 bg-brand-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              <span className="text-brand-600 underline">Click to browse</span> or drag & drop photos here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports JPG, PNG, WEBP (Max {maxFiles} photos, 5MB each)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thumbnails preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
              <img
                src={img.previewUrl}
                alt={img.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(idx);
                }}
                className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[10px] px-1.5 py-0.5 truncate text-center">
                Photo {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
