import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

export async function burnSubtitlesAndChangeFPS(
  videoFile: File,
  subtitleFile: File,
  targetFps: number = 30
): Promise<Blob> {
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
    });
  }

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

  // แก้ TypeScript ทุกกรณี: data อาจเป็น string หรือ Uint8Array
  const uint8Array = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : data as Uint8Array;

  return new Blob([uint8Array as any], { type: 'video/mp4' });

}