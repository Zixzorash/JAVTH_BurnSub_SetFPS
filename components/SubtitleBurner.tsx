'use client';
import { useState, useEffect } from 'react';
import { burnSubtitlesAndChangeFPS } from '@/lib/ffmpeg';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function SubtitleBurner() {
  const [video, setVideo] = useState<File | null>(null);
  const [subtitle, setSubtitle] = useState<File | null>(null);
  const [fps, setFps] = useState(30);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [s3Url, setS3Url] = useState('');

  useEffect(() => {
    // Load Google API for Drive Picker
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => loadGooglePicker();
    document.head.appendChild(script);
  }, []);

  const loadGooglePicker = () => {
    window.gapi.load('picker', () => {
      // Ready
    });
  };

  const handleGoogleDrivePick = () => {
    // ต้องใส่ Client ID ของ Google API Console ของคุณที่นี่
    const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // แทนที่ด้วย Client ID จริง
    const DEVELOPER_KEY = 'YOUR_API_KEY';
    const APP_ID = 'YOUR_APP_ID';
    const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

    window.gapi.load('auth', { immediate: false }, () => {
      window.gapi.auth.authorize({ client_id: CLIENT_ID, scope: SCOPE }, (authResult: any) => {
        if (authResult && !authResult.error) {
          const picker = new window.google.picker.PickerBuilder()
            .addView(window.google.picker.ViewId.DOCS_VIDEOS)
            .addView(window.google.picker.ViewId.DOCS)
            .setOAuthToken(authResult.access_token)
            .setDeveloperKey(DEVELOPER_KEY)
            .setCallback((data: any) => {
              if (data.action === window.google.picker.Action.PICKED) {
                data.docs.forEach((doc: any) => {
                  fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                    headers: { Authorization: `Bearer ${authResult.access_token}` }
                  }).then(r => r.blob()).then(blob => {
                    if (doc.mimeType.includes('video')) setVideo(new File([blob], doc.name));
                    else if (doc.mimeType.includes('text')) setSubtitle(new File([blob], doc.name));
                  });
                });
              }
            })
            .build();
          picker.setVisible(true);
        }
      });
    });
  };

  const handleOneDrivePick = () => {
    // สำหรับ OneDrive ใช้ Microsoft Graph API – ต้องมี App Registration
    window.open('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_MS_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000&scope=files.read', '_blank');
    // หลังล็อกอิน จะ redirect กลับและดึงไฟล์ (implement token exchange ใน useEffect)
  };

  const handleS3Load = () => {
    if (!s3Url) return;
    fetch(s3Url)
      .then(r => r.blob())
      .then(blob => {
        // Assume first is video, second is subtitle if multiple
        setVideo(new File([blob], 'video.mp4')); // ปรับตาม
      });
  };

  const handleProcess = async () => {
    if (!video || !subtitle) {
      alert('กรุณาอัปโหลดไฟล์ MP4 และ Subtitle');
      return;
    }
    setProcessing(true);
    try {
      const outputBlob = await burnSubtitlesAndChangeFPS(video, subtitle, fps);
      const url = URL.createObjectURL(outputBlob);
      setResultUrl(url);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message);
    }
    setProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-8 text-center">JAV Burn Subtitle & Set FPS (เวอร์ชัน Cloud Picker)</h1>
      
      {/* Cloud Pickers */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button onClick={handleGoogleDrivePick} className="bg-red-500 text-white py-2 px-4 rounded">Google Drive Picker</button>
        <button onClick={handleOneDrivePick} className="bg-blue-500 text-white py-2 px-4 rounded">OneDrive Picker</button>
        <div className="flex">
          <input type="text" value={s3Url} onChange={e => setS3Url(e.target.value)} placeholder="S3 URL" className="p-2 border rounded-l" />
          <button onClick={handleS3Load} className="bg-yellow-500 text-white py-2 px-4 rounded-r">Load S3</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2">อัปโหลดไฟล์ MP4:</label>
        <input type="file" accept="video/mp4" onChange={(e) => setVideo(e.target.files?.[0] || null)} className="w-full p-2 border rounded" />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">อัปโหลด Subtitle (.srt):</label>
        <input type="file" accept=".srt" onChange={(e) => setSubtitle(e.target.files?.[0] || null)} className="w-full p-2 border rounded" />
      </div>
      
      <div className="mb-6">
        <label className="block mb-2">Frame Rate:</label>
        <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full p-2 border rounded">
          <option value={23.976}>23.976 fps</option>
          <option value={24}>24 fps</option>
          <option value={25}>25 fps</option>
          <option value={30}>30 fps</option>
          <option value={60}>60 fps</option>
        </select>
      </div>

      <button
        onClick={handleProcess}
        disabled={!video || !subtitle || processing}
        className="w-full bg-blue-600 text-white py-3 rounded disabled:opacity-50"
      >
        {processing ? 'กำลังประมวลผล...' : 'เริ่ม Burn Subtitle'}
      </button>

      {resultUrl && (
        <div className="mt-6">
          <a href={resultUrl} download="output.mp4" className="block w-full bg-green-600 text-white py-3 rounded text-center">
            ดาวน์โหลดไฟล์ที่ได้
          </a>
        </div>
      )}
    </div>
  );
}
