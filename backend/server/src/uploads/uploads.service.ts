import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

export type ExtractedCard = { title: string; content: string; level: number };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

@Injectable()
export class UploadsService {
  private readonly MAX_CARDS = 25;

  async extractCardsFromBuffer(buffer: Buffer, mimetype: string): Promise<ExtractedCard[]> {
    if (mimetype === 'application/pdf') return this.fromPdf(buffer);
    if (mimetype.startsWith('audio/')) return this.fromAudio(buffer, mimetype.split('/')[1]);
    if (mimetype.startsWith('video/')) return this.fromVideo(buffer, mimetype.split('/')[1]);
    throw new UnsupportedMediaTypeException('Unsupported file type');
  }

  private async fromPdf(buffer: Buffer): Promise<ExtractedCard[]> {
    const data = await pdfParse(buffer);
    const text = (data.text || '').replace(/\n{2,}/g, '\n').trim();
    const chunks = this.chunkText(text, 280, 8);
    return chunks.slice(0, this.MAX_CARDS).map((chunk, i) => ({
      title: `PDF Segment ${i + 1}`,
      content: chunk,
      level: 1,
    }));
  }

  private async fromAudio(buffer: Buffer, ext: string): Promise<ExtractedCard[]> {
    const tmpFile = path.join('/tmp', `upload.${ext}`);
    fs.writeFileSync(tmpFile, buffer);

    const resp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: 'whisper-1',
    });

    return this.fromTranscript(resp.text ?? '');
  }

  private async fromVideo(buffer: Buffer, ext: string): Promise<ExtractedCard[]> {
    const tmpVideo = path.join('/tmp', `upload.${ext}`);
    const tmpAudio = path.join('/tmp', `upload.wav`);
    fs.writeFileSync(tmpVideo, buffer);

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-y',
        '-i', tmpVideo,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        tmpAudio,
      ]);
      ff.on('close', code => (code === 0 ? resolve() : reject(new Error('ffmpeg failed'))));
    });

    const resp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpAudio),
      model: 'whisper-1',
    });

    return this.fromTranscript(resp.text ?? '');
  }

  private fromTranscript(text: string): ExtractedCard[] {
    const chunks = this.chunkText(text, 260, 8);
    return chunks.slice(0, this.MAX_CARDS).map((chunk, i) => ({
      title: `Transcript Segment ${i + 1}`,
      content: chunk,
      level: 1,
    }));
  }

  private chunkText(text: string, targetLen = 240, tolerance = 5): string[] {
    const sentences = text.split(/(?<=[.?!])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const s of sentences) {
      if ((current + ' ' + s).trim().length <= targetLen + tolerance) {
        current = (current ? current + ' ' : '') + s.trim();
      } else {
        if (current) chunks.push(current);
        current = s.trim();
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }
}
