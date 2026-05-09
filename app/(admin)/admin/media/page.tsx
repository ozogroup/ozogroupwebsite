"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/actions/storage";
import ImageUpload from "@/components/admin/ImageUpload";

export default function AdminMediaLibraryPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(file: File, folder: string) {
    setUploading(true);
    setError("");
    setUploadedUrl("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      
      const result = await uploadImage(formData);
      if (result.url) {
        setUploadedUrl(result.url);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (uploading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Media Library</h1>
        <p className="text-sm text-brand-muted">Manage images and media files</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft p-6 md:p-8 border border-brand-border">
        <h2 className="font-display text-lg font-semibold text-brand-ink mb-6 flex items-center gap-2">
          <span className="text-xl">📤</span>
          Upload New Image
        </h2>
        
        <ImageUpload
          value=""
          onChange={(url: string) => setUploadedUrl(url)}
          folder="general"
          label="Select Image"
        />

        {uploadedUrl && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 mb-2">✓ Upload successful!</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={uploadedUrl}
                className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(uploadedUrl);
                  alert("URL copied to clipboard!");
                }}
                className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
        <h2 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
          <span className="text-xl">ℹ️</span>
          Setup Instructions
        </h2>
        <div className="space-y-3 text-sm text-brand-muted">
          <p>
            <strong className="text-brand-ink">Note:</strong> Uploads use Supabase Storage. Ensure setup:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Create a Storage bucket named <code className="bg-brand-surface px-1 rounded">media</code> in Supabase</li>
            <li>Enable public access for the bucket</li>
            <li>Ensure environment variables are configured</li>
          </ol>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
        <h2 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
          <span className="text-xl">🔗</span>
          Alternative: External Hosting
        </h2>
        <p className="text-sm text-brand-muted mb-4">
          You can also use external image hosting services:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="https://imgbb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-brand-border rounded-lg hover:border-brand-accent hover:bg-brand-surface transition-colors text-center"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm font-medium text-brand-ink">ImgBB</div>
          </a>
          <a
            href="https://imgur.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-brand-border rounded-lg hover:border-brand-accent hover:bg-brand-surface transition-colors text-center"
          >
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm font-medium text-brand-ink">Imgur</div>
          </a>
          <a
            href="https://cloudinary.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-brand-border rounded-lg hover:border-brand-accent hover:bg-brand-surface transition-colors text-center"
          >
            <div className="text-2xl mb-2">☁️</div>
            <div className="text-sm font-medium text-brand-ink">Cloudinary</div>
          </a>
          <a
            href="https://aws.amazon.com/s3/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-brand-border rounded-lg hover:border-brand-accent hover:bg-brand-surface transition-colors text-center"
          >
            <div className="text-2xl mb-2">🗄️</div>
            <div className="text-sm font-medium text-brand-ink">AWS S3</div>
          </a>
        </div>
      </div>
    </div>
  );
}
