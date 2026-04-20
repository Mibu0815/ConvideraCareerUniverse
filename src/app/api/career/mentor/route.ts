// src/app/api/career/mentor/route.ts
// API Route für den KI-Mentor

import { NextRequest, NextResponse } from 'next/server';
import { compareRoles } from '@/lib/services/career-logic';
import { getMentorAdvice, getMentorGreeting, chatWithMentor, MissingApiKeyError } from '@/lib/services/mentor-chat';

// ─── In-memory rate limiting (10 req/user/min) ───

const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

interface MentorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MentorRequest {
  action: 'greeting' | 'advice' | 'chat';
  fromRoleId?: string | null;
  toRoleId: string;
  message?: string;
  conversationHistory?: MentorMessage[];
}

export interface MentorResponse {
  type: 'greeting' | 'advice' | 'chat';
  content: string;
  keyActions?: string[];
  prioritySkills?: {
    skill: string;
    currentLevel: number;
    targetLevel: number;
    recommendation: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (user identity not available without auth parsing)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie eine Minute.' },
        { status: 429 }
      );
    }

    const body: MentorRequest = await request.json();

    if (!body.toRoleId) {
      return NextResponse.json(
        { error: 'toRoleId is required' },
        { status: 400 }
      );
    }

    // Hole die Gap-Analyse als Kontext
    const analysis = await compareRoles(body.fromRoleId || null, body.toRoleId);

    let response: MentorResponse;

    switch (body.action) {
      case 'greeting':
        const greeting = await getMentorGreeting(analysis);
        response = {
          type: 'greeting',
          content: greeting,
        };
        break;

      case 'advice':
        const adviceResult = await getMentorAdvice({
          analysis,
          question: body.message,
        });
        response = {
          type: 'advice',
          content: adviceResult.advice,
          keyActions: adviceResult.keyActions,
          prioritySkills: adviceResult.prioritySkills,
        };
        break;

      case 'chat':
        if (!body.message) {
          return NextResponse.json(
            { error: 'message is required for chat action' },
            { status: 400 }
          );
        }
        const chatResponse = await chatWithMentor(
          analysis,
          body.message,
          body.conversationHistory || []
        );
        response = {
          type: 'chat',
          content: chatResponse,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: greeting, advice, or chat' },
          { status: 400 }
        );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Mentor API error:', error);

    // Handle missing API key error specifically
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error: 'AI Mentor ist nicht konfiguriert',
          message: 'Der ANTHROPIC_API_KEY ist nicht in den Umgebungsvariablen hinterlegt. Bitte kontaktieren Sie den Administrator.',
          code: 'MISSING_API_KEY'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
