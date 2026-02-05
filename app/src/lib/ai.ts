import { supabase } from './supabase';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';

export interface GeneratedQuestion {
  question: string;
  correct_answer: string;
  wrong_answer_1: string;
  wrong_answer_2: string;
  wrong_answer_3: string;
}

export async function generateQuestionsFromNotes(
  content: string,
  userId: string,
  noteId: string
): Promise<GeneratedQuestion[] | null> {
  if (!CLAUDE_API_KEY) {
    console.error('Claude API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Generate 10 multiple choice quiz questions from these study notes.

Each question should have exactly 4 answer choices with only one correct answer.

Return ONLY a valid JSON array with no markdown:
[{"question": "...", "correct_answer": "...", "wrong_answer_1": "...", "wrong_answer_2": "...", "wrong_answer_3": "..."}]

NOTES:
${content}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions: GeneratedQuestion[] = JSON.parse(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }

    const inserts = questions.map((q) => ({
      note_id: noteId,
      user_id: userId,
      question: q.question,
      correct_answer: q.correct_answer,
      wrong_answer_1: q.wrong_answer_1,
      wrong_answer_2: q.wrong_answer_2,
      wrong_answer_3: q.wrong_answer_3,
    }));

    await supabase.from('note_questions').insert(inserts);
    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    return null;
  }
}

export async function extractTextFromImage(base64Image: string): Promise<string | null> {
  if (!CLAUDE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
              },
              {
                type: 'text',
                text: 'Extract all the text from this image of notes. Return only the extracted text.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error('Error extracting text:', error);
    return null;
  }
}
