"use client";

import { useState } from "react";

export default function AdminMediaLibraryPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("treatment");
  const [altText, setAltText] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    // TODO: Implement Supabase Storage upload
    // For now, just simulate upload
    setTimeout(() => {
      setUploading(false);
      alert("File upload functionality requires Supabase Storage setup. Please configure Supabase Storage bucket first.");
      setSelectedFile(null);
      setAltText("");
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
        <p className="text-slate-600">Manage images and media assets for the website</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload New Image</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
            >
              <option value="treatment">Treatment Images</option>
              <option value="hero">Hero Images</option>
              <option value="about">About Images</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Alt Text (optional)</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Description for accessibility"
            />
          </div>
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Instructions</h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <strong>Note:</strong> To enable file uploads, you need to set up Supabase Storage:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Create a Storage bucket named "media" in your Supabase project</li>
            <li>Enable public access for the bucket (or set up proper RLS policies)</li>
            <li>Add the Supabase Storage upload functionality to the media actions</li>
            <li>Configure CORS settings for your domain</li>
          </ol>
          <p className="mt-4">
            For now, you can use external image URLs in the Content Management and Treatments pages.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Alternative: Use External URLs</h2>
        <p className="text-sm text-slate-600 mb-4">
          Instead of uploading files, you can use external image hosting services like:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="https://imgbb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-slate-200 rounded-lg hover:border-brand-accent transition-colors text-center"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm font-medium text-slate-900">ImgBB</div>
          </a>
          <a
            href="https://imgur.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-slate-200 rounded-lg hover:border-brand-accent transition-colors text-center"
          >
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm font-medium text-slate-900">Imgur</div>
          </a>
          <a
            href="https://cloudinary.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-slate-200 rounded-lg hover:border-brand-accent transition-colors text-center"
          >
            <div className="text-2xl mb-2">☁️</div>
            <div className="text-sm font-medium text-slate-900">Cloudinary</div>
          </a>
          <a
            href="https://aws.amazon.com/s3/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-slate-200 rounded-lg hover:border-brand-accent transition-colors text-center"
          >
            <div className="text-2xl mb-2">🗄️</div>
            <div className="text-sm font-medium text-slate-900">AWS S3</div>
          </a>
        </div>
      </div>
    </div>
  );
}
