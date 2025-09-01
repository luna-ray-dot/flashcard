import { Controller, Post, UploadedFile, UseInterceptors, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, dirname, join } from 'path';
import fs from 'fs';
import { CardsService } from '../cards/cards.service';
import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface CardInput {
  title?: string;
  content?: string;
  question?: string;
  answer?: string;
  level?: number;
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('file/:userId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_, file, cb) => {
        const allowed = ['.pdf', '.txt', '.mp3', '.wav', '.mp4', '.jpg', '.jpeg', '.png'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Unsupported file type'), false);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('userId') userId: string) {
    if (!file) return { error: 'No file uploaded' };

    const filePath = file.path;
    let extractedText = '';

    try {
      if (file.mimetype.startsWith('text') || file.mimetype === 'application/pdf') {
        if (file.mimetype === 'application/pdf') {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          extractedText = pdfData.text;
        } else {
          extractedText = fs.readFileSync(filePath, 'utf-8');
        }
      } else if (file.mimetype.startsWith('audio')) {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: 'whisper-1',
        });
        extractedText = transcription.text;
      } else if (file.mimetype.startsWith('video')) {
        const audioPath = join(dirname(filePath), 'audio.wav');
        await new Promise<void>((resolve, reject) => {
          ffmpeg(filePath)
            .output(audioPath)
            .noVideo()
            .on('end', () => resolve())
            .on('error', reject)
            .run();
        });
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: 'whisper-1',
        });
        extractedText = transcription.text;
      } else if (file.mimetype.startsWith('image')) {
        const { data } = await Tesseract.recognize(filePath, 'eng');
        extractedText = data.text;
      }

      const prompt = `Generate a list of flashcards (question and answer) from this content:\n${extractedText}\nOutput JSON array [{ "question": "...", "answer": "..." }]`;
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });

      const jsonText = aiResponse.choices?.[0]?.message?.content ?? '[]';
      let cards: CardInput[] = [];
      try {
        cards = JSON.parse(jsonText) as CardInput[];
      } catch {
        cards = [];
      }

      const createdCards: any[] = [];
      for (const c of cards) {
        const card = await this.cardsService.createCard(userId, {
          title: c.title || c.question || 'Untitled',
          content: c.content || c.answer || '',
          level: c.level ?? 1,
        });
        createdCards.push(card);
      }

      return { uploaded: true, cards: createdCards };
    } catch (err: any) {
      console.error('File processing error', err);
      return { error: err.message };
    }
  }
}
