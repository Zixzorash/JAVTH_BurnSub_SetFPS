'use client';

import dynamic from 'next/dynamic';

// ใช้ dynamic import และปิด ssr เพื่อไม่ให้ server พยายามรัน code ที่มี ffmpeg
const SubtitleBurner = dynamic(
  () => import('@/components/SubtitleBurner'),
  { 
    ssr: false,
    loading: () => <div className="text-center p-4">Loading Component...</div>
  }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <SubtitleBurner />
    </main>
  );
}
