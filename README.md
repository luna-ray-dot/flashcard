# Flashcard Application

A comprehensive flashcard learning application built with NestJS, Neo4j, and AI-powered features.

## Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Flashcard Management**: Create, review, and manage flashcards with spaced repetition
- **AI-Powered Card Generation**: Upload files (PDF, audio, video, images) to auto-generate flashcards using OpenAI
- **Real-time Battles**: Compete with other users or AI in flashcard battles
- **Analytics**: Track learning progress and performance
- **File Processing**: Support for PDF text extraction, audio transcription, video processing, and OCR

## Prerequisites

- Node.js 18+
- Neo4j 4.4+
- FFmpeg
- OpenAI API key (for AI features)

## Setup

1. **Install System Dependencies**
   ```bash
   # Install FFmpeg
   sudo apt update && sudo apt install -y ffmpeg
   
   # Install Neo4j
   wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
   echo 'deb https://debian.neo4j.com stable 4.4' | sudo tee /etc/apt/sources.list.d/neo4j.list
   sudo apt update && sudo apt install -y neo4j
   ```

2. **Configure Neo4j**
   ```bash
   sudo neo4j-admin set-initial-password myStrongPassword123
   sudo systemctl enable neo4j && sudo systemctl start neo4j
   ```

3. **Install Dependencies**
   ```bash
   cd backend/server && npm install
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values, especially OPENAI_API_KEY
   ```

5. **Start Application**
   ```bash
   cd backend/server && npm run start:dev
   ```

## API Endpoints

- `GET /` - Health check
- `POST /users/register` - User registration
- `POST /auth/login` - User authentication
- `POST /cards/create/:userId` - Create flashcard
- `POST /uploads/file/:userId` - Upload file for AI card generation
- `POST /battles/create` - Create battle
- `GET /analytics` - Get user analytics

## Environment Variables

See `.env.example` for all required environment variables.

## Architecture

The application is a sophisticated flashcard learning platform with the following architecture:

- **Backend**: NestJS with TypeScript, using modular architecture
- **Database**: Neo4j graph database for complex relationships between users, cards, and learning data
- **AI Integration**: OpenAI for generating flashcards from uploaded content
- **File Processing**: Support for PDF, audio, video, and image files with appropriate processing pipelines
- **Real-time Features**: WebSocket support for live battles and contests

Key modules include:
- **Auth Module**: JWT authentication with passport strategies
- **Cards Module**: Flashcard CRUD with spaced repetition algorithm
- **Uploads Module**: File processing with AI-powered card generation
- **Battles Module**: Real-time competitive flashcard battles
- **AI Chat Module**: AI-powered learning recommendations
- **Analytics Module**: Learning progress tracking
