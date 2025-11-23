import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// เปลี่ยนจาก const ffmpeg = new FFmpeg(); เป็นการสร้างตัวแปรมารอไว้ก่อน
let ffmpeg: FFmpeg | null = null;

export async function burnSubtitlesAndChangeFPS(
  videoFile: File,
  subtitleFile: File,
  targetFps: number = 30
): Promise<Blob> {
  
  // สร้าง instance เมื่อเริ่มเรียกใช้ฟังก์ชันเท่านั้น (Lazy instantiation)
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
  }

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
    });
  }

  // ... (โค้ดส่วนที่เหลือเหมือนเดิม) ...
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
  await ffmpeg.writeFile('subtitle.srt', await fetchFile(subtitleFile));

  const outputName = 'output.mp4';

  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-vf', `fps=${targetFps},subtitles=subtitle.srt:force_style='FontSize=24,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,BorderStyle=3'`,
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);

  const uint8Array = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : data as Uint8Array;

  return new Blob([uint8Array as any], { type: 'video/mp4' });
}
