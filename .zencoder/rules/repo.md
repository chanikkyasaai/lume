---
description: Repository Information Overview
alwaysApply: true
---

# Lume - Interactive AI Council

## Summary
Lume is an innovative platform that transforms traditional AI interactions by creating dynamic multi-persona AI councils. Instead of chatting with a single AI, users can summon specialized AI experts who collaborate, debate, and provide comprehensive insights through voice and text interactions.

## Structure
- **src/**: Main source code directory containing React components, services, and application logic
- **public/**: Static assets served directly by the web server
- **dist/**: Build output directory containing compiled and optimized production files
- **.vercel/**: Vercel deployment configuration

## Language & Runtime
**Language**: TypeScript 5.8.3
**Framework**: React 18.3.1
**Build System**: Vite 5.4.19
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18.3.1 with React DOM and React Router
- shadcn/ui components (via Radix UI primitives)
- TanStack React Query for data fetching
- Tailwind CSS for styling
- Zod for schema validation
- React Hook Form for form handling

**Development Dependencies**:
- Vite with SWC plugin for fast builds
- ESLint 9.32.0 for code linting
- TypeScript 5.8.3 for type checking
- Tailwind CSS and PostCSS for styling

## Features
- **Discussion Mode**: 4 specialized AI personas collaborate on user topics
- **Debate Mode**: Two AI personas engage in structured arguments
- **Interview Mode**: Realistic job interview simulation with AI interviewer
- **Voice Input/Output**: Natural interaction using speech recognition and synthesis
- **Real-time Collaboration**: AI experts building on each other's ideas
- **User Moderation**: Control over debate flow and topics

## Technical Integration
- **AI Integration**: Cerebras API for intelligent responses
- **Voice Processing**: Assembly AI for speech-to-text
- **Audio Generation**: Murf AI for text-to-speech

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Deployment
**Platform**: Vercel
**Configuration**: vercel.json with SPA routing
**Build Command**: npm run build
**Output Directory**: dist
**Framework**: Vite

**Deployment Commands**:
```bash
# Using Vercel CLI
vercel
vercel --prod
```

## Environment Variables
**Required Variables**:
- ASSEMBLYAI_API_KEY: API key for AssemblyAI speech recognition
- CEREBRAS_API_KEY: API key for Cerebras AI services
- MURF_API_KEY: API key for Murf voice synthesis

## Main Files & Resources
**Entry Point**: src/main.tsx
**App Configuration**: src/App.tsx
**Key Components**:
- src/pages/: Main application pages (Index, Council, NotFound)
- src/components/: UI components including PanelistCard, ChatInput, etc.
- src/services/: API services for AssemblyAI and AI Council
- src/hooks/: Custom React hooks

## Development Status
- ✅ Multi-mode AI interactions (Discussion, Debate, Interview)
- ✅ Voice input/output integration
- ✅ Responsive UI with custom scrollbar design
- ✅ API key management system
- ✅ Vercel deployment configuration
- 🔄 Advanced conversation persistence
- 🔄 Enhanced persona customization
- 🔄 Performance optimizations