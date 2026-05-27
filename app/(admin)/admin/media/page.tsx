"use client";

import { useState, useEffect } from "react";
import { uploadImage, listImages, deleteImage } from "@/lib/actions/storage";
import ImageUpload from "@/components/admin/ImageUpload";
import Image from "next/image";

export default function AdminMediaLibraryPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [folderFilter, setFolderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("general");

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    setLoadingImages(true);
    const data = await listImages();
    setImages(data || []);
    setLoadingImages(false);
  }

  async function handleUpload(file: File, folder: string) {
    setUploading(true);
    setError("");
    setUploadedUrl("");
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await uploadImage(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.url) {
        setUploadedUrl(result.url);
        await loadImages();
      } else {
        setError(result.error || "Upload failed");
        setUploadProgress(0);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (imageFile) {
      handleUpload(imageFile, selectedFolder);
    } else {
      setError("Please drop an image file");
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    
    // Create folder by uploading a placeholder file
    try {
      const formData = new FormData();
      const placeholderFile = new File([''], '.gitkeep', { type: 'text/plain' });
      formData.append("file", placeholderFile);
      formData.append("folder", newFolderName.trim());
      
      await uploadImage(formData);
      setNewFolderName("");
      setShowFolderInput(false);
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Failed to create folder");
    }
  }

  function handleReplaceImage(image: any) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const folder = getFolderFromPath(image.name);
        handleUpload(file, folder);
        // Delete old image after upload
        handleDelete(image.name, image.name);
      }
    };
    input.click();
  }

  async function handleDelete(path: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      const result = await deleteImage(path);
      if (result.error) {
        setError(result.error);
      } else {
        await loadImages();
        if (showPreview) setShowPreview(false);
      }
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url);
    // Show brief success feedback
    const originalText = "Copy URL";
    const btn = document.activeElement as HTMLButtonElement;
    if (btn) {
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1500);
    }
  }

  function getPublicUrl(path: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return `${supabaseUrl}/storage/v1/object/public/media/${path}`;
  }

  function getFolderFromPath(path: string): string {
    const parts = path.split('/');
    if (parts.length > 1) {
      return parts[0];
    }
    return 'general';
  }

  function getImageSize(image: any): number {
    return image.metadata?.size || 0;
  }

  function getImageDimensions(image: any): string {
    const width = image.metadata?.width || 0;
    const height = image.metadata?.height || 0;
    if (width && height) {
      return `${width}x${height}`;
    }
    return 'Unknown';
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Filter and sort images
  const filteredImages = images
    .filter(image => {
      const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = folderFilter === "all" || getFolderFromPath(image.name) === folderFilter;
      return matchesSearch && matchesFolder;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === "size") return getImageSize(b) - getImageSize(a);
      return 0;
    });

  // Get unique folders
  const folders = ["all", ...Array.from(new Set(images.map(img => getFolderFromPath(img.name))))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
          <p className="text-slate-600 mt-1">Manage images and media files</p>
        </div>
        <button
          onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-ink to-brand-muted text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Image
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Images</p>
          <p className="text-2xl font-bold text-slate-900">{images.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Size</p>
          <p className="text-2xl font-bold text-slate-900">{formatFileSize(images.reduce((acc, img) => acc + getImageSize(img), 0))}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Folders</p>
          <p className="text-2xl font-bold text-slate-900">{folders.length - 1}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Recent Uploads</p>
          <p className="text-2xl font-bold text-slate-900">{images.filter(img => {
            const uploadDate = new Date(img.created_at || 0);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return uploadDate > weekAgo;
          }).length}</p>
        </div>
      </div>

      {/* Upload Section */}
      <div 
        id="upload-section"
        className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
          dragOver ? 'border-brand-accent bg-brand-accent/5' : 'border-slate-200'
        } p-6`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <span className="text-xl">📤</span>
          Upload New Image
        </h2>
        
        {/* Folder Selection & Creation */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Upload to Folder</label>
          <div className="flex gap-2">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
            >
              {folders.filter(f => f !== "all").map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFolderInput(!showFolderInput)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              + New Folder
            </button>
          </div>
          {showFolderInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:shadow-glow transition-all font-medium"
              >
                Create
              </button>
            </div>
          )}
        </div>

        {/* Drag-Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragOver 
              ? 'border-brand-accent bg-brand-accent/10' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }`}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-slate-900 font-medium">
                {dragOver ? 'Drop image here' : 'Drag & drop an image here'}
              </p>
              <p className="text-slate-500 text-sm mt-1">or use the uploader below</p>
            </div>
          </div>
        </div>

        <ImageUpload
          value=""
          onChange={(url: string) => setUploadedUrl(url)}
          folder={selectedFolder}
          label="Or select from your device"
        />

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Uploading...</span>
              <span className="text-sm text-slate-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-brand-primary to-brand-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

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
                onClick={() => copyToClipboard(uploadedUrl)}
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

      {/* Image Gallery */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              Image Gallery
              <span className="text-sm font-normal text-slate-500">({filteredImages.length} images)</span>
            </h2>
            <button
              onClick={loadImages}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
            />
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
            >
              <option value="all">All Folders</option>
              {folders.filter(f => f !== "all").map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        </div>

        {loadingImages ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-slate-600 font-medium mb-2">No images found</p>
            <p className="text-sm text-slate-500 mb-4">Upload your first image to get started</p>
            <button
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 bg-gradient-to-r from-brand-ink to-brand-muted text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
            >
              Upload Image
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    setSelectedImage(image);
                    setShowPreview(true);
                  }}
                >
                  <Image
                    src={getPublicUrl(image.name)}
                    alt={image.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-medium truncate">{image.name.split('/').pop()}</p>
                      <p className="text-white/70 text-xs">{formatFileSize(getImageSize(image))} • {getImageDimensions(image)}</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(getPublicUrl(image.name));
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors"
                      title="Copy URL"
                    >
                      <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.name, image.name);
                      }}
                      className="p-2 bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedImage && (
        <div className="fixed inset-0 bg-brand-ink/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedImage.name.split('/').pop()}</h3>
                <p className="text-sm text-slate-500">{formatFileSize(getImageSize(selectedImage))} • {formatDate(selectedImage.created_at)}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-slate-50">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-white">
                <Image
                  src={getPublicUrl(selectedImage.name)}
                  alt={selectedImage.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <input
                type="text"
                readOnly
                value={getPublicUrl(selectedImage.name)}
                className="flex-1 px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(getPublicUrl(selectedImage.name))}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => handleReplaceImage(selectedImage)}
                  className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:shadow-glow transition-all font-medium"
                >
                  Replace
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedImage.name, selectedImage.name);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
