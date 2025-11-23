import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

export async function burnSubtitlesAndChangeFPS(
  videoFile: File,
  subtitleFile: File,
  targetFps: number = 30
): Promise<Blob> {
  if (!ffmpeg.isLoaded()) await ffmpeg.load();

  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
  ffmpeg.FS('writeFile', 'subtitle.srt', await fetchFile(subtitleFile));

  const outputName = 'output.mp4';

  await ffmpeg.run(
    '-i', 'input.mp4',
    '-vf', `fps=${targetFps},subtitles=subtitle.srt:force_style='FontSize=24,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,BorderStyle=3'`,
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName
  );

  const data = ffmpeg.FS('readFile', outputName);
  return new Blob([data.buffer], { type: 'video/mp4' });
}
