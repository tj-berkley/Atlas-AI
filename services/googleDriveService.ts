export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: string;
  webViewLink: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const redirectUri = window.location.origin;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.CLIENT_ID}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=token&` +
        `scope=${this.SCOPES}`;

      const authWindow = window.open(authUrl, 'Google Drive Auth', 'width=500,height=600');

      const checkWindow = setInterval(() => {
        try {
          if (authWindow?.closed) {
            clearInterval(checkWindow);
            resolve(false);
          }

          if (authWindow?.location.hash) {
            const hash = authWindow.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');

            if (token) {
              this.accessToken = token;
              localStorage.setItem('google_drive_token', token);
              authWindow.close();
              clearInterval(checkWindow);
              resolve(true);
            }
          }
        } catch (e) {
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkWindow);
        if (!this.accessToken) {
          resolve(false);
        }
      }, 60000);
    });
  }

  disconnect(): void {
    this.accessToken = null;
    localStorage.removeItem('google_drive_token');
  }

  isConnected(): boolean {
    if (this.accessToken) return true;

    const token = localStorage.getItem('google_drive_token');
    if (token) {
      this.accessToken = token;
      return true;
    }

    return false;
  }

  async uploadFile(file: File, folderId?: string): Promise<string | null> {
    if (!this.accessToken) return null;

    const metadata = {
      name: file.name,
      mimeType: file.type,
      ...(folderId && { parents: [folderId] }),
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: form,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  async listFiles(pageSize = 20): Promise<DriveFile[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `pageSize=${pageSize}&` +
        `fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&` +
        `orderBy=modifiedTime desc`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to list files');

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async downloadFile(fileId: string): Promise<Blob | null> {
    if (!this.accessToken) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Download failed');

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async exportChatHistory(messages: any[]): Promise<string | null> {
    const content = messages.map(m => `[${m.created_at}] ${m.role}: ${m.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], `atlas-chat-${Date.now()}.txt`, { type: 'text/plain' });

    return await this.uploadFile(file);
  }

  async exportRoutes(routes: any[]): Promise<string | null> {
    const content = JSON.stringify(routes, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const file = new File([blob], `atlas-routes-${Date.now()}.json`, { type: 'application/json' });

    return await this.uploadFile(file);
  }
}

export const googleDriveService = new GoogleDriveService();
