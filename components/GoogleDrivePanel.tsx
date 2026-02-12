import { useState, useEffect } from 'react';
import { Cloud, Upload, Download, Trash2, FileText, Link as LinkIcon } from 'lucide-react';
import { googleDriveService, DriveFile } from '../services/googleDriveService';

export default function GoogleDrivePanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsConnected(googleDriveService.isConnected());
    if (googleDriveService.isConnected()) {
      loadFiles();
    }
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    const success = await googleDriveService.connect();
    setIsConnected(success);
    if (success) {
      await loadFiles();
    }
    setIsLoading(false);
  };

  const handleDisconnect = () => {
    googleDriveService.disconnect();
    setIsConnected(false);
    setFiles([]);
  };

  const loadFiles = async () => {
    setIsLoading(true);
    const driveFiles = await googleDriveService.listFiles();
    setFiles(driveFiles);
    setIsLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileId = await googleDriveService.uploadFile(file);
    if (fileId) {
      await loadFiles();
    }
    setIsUploading(false);
    event.target.value = '';
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file from Google Drive?')) return;

    const success = await googleDriveService.deleteFile(fileId);
    if (success) {
      await loadFiles();
    }
  };

  const formatFileSize = (bytes: string): string => {
    const size = parseInt(bytes);
    if (isNaN(size)) return 'Unknown';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">Google Drive</h2>
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Disconnect
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <Cloud className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Google Drive</h3>
          <p className="text-sm text-gray-600 mb-4">
            Backup your chat history, routes, and reports to Google Drive
          </p>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {isLoading ? 'Connecting...' : 'Connect Google Drive'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors">
                <Upload className="w-5 h-5" />
                <span className="font-medium">
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </span>
              </div>
            </label>
            <button
              onClick={loadFiles}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading && files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No files uploaded yet</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {formatDate(file.modifiedTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Open</span>
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
