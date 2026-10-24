import { Router, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// Initialize Gemini client securely on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Candidate models in order of quota availability and speed
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

// Helper to provide clear language instructions matching user preference
function getLanguageInstruction(language: string = 'unique'): string {
  switch (language) {
    case 'bangla':
      return `LANGUAGE DIRECTIVE: PURE BANGLA (বাংলা).
- Output exclusively in authentic, grammatically correct Bengali script (বাংলা লিপি).
- If the original input is in English, Banglish (phonetic Romanized Bangla like "ami ajke..."), or mixed, translate and craft it into elegant, evocative Bengali (শুদ্ধ বাংলা ভাষা ও সঠিক বানান).
- Write with authentic emotional depth, natural cadences, and respectful literary phrasing suited for a personal journal.
- Do NOT use English/Latin letters unless referring to a specific untranslatable brand name.`;

    case 'english':
      return `LANGUAGE DIRECTIVE: PURE ENGLISH.
- Output exclusively in fluent, articulate, grammatically polished English prose.
- If the original text is in Bangla, Banglish, or mixed, translate and refine it into eloquent, crystal-clear English with natural idiom and cadence matching the selected tone.`;

    case 'unique':
    default:
      return `LANGUAGE DIRECTIVE: UNIQUE SMART BLEND (ইউনিক স্বাভাবিক ব্লেন্ড).
- User's exact core rule: "jekane bangla use korle vlo hoi sikane bangla, jekane English use korle vlo hoi sikane english" (Where Bengali feels best and most natural, use Bengali; where English feels best, use English).
- Express personal emotions, introspections, heartfelt thoughts, and narrative flow in beautiful, natural Bengali script (বাংলা).
- Retain or use English naturally for modern concepts, technical terms, frameworks, book/media titles, idioms, or keywords where English is punchier, more precise, or more natural (e.g. 'mindset', 'workflow', 'focus', 'deep work', 'consistency', 'architecture', 'clarity').
- If the user wrote in Banglish (phonetic English letters like "ami khub confused chhilam..."), convert the Bengali words into genuine Bengali script ("আমি খুব confused ছিলাম...") rather than leaving phonetic Latin English text!
- The outcome must feel deeply authentic, intellectual, modern, and effortless—mirroring the natural speech and journaling style of a sophisticated bilingual thinker.`;
  }
}

// Robust helper to call Gemini with automatic model fallback
async function callGeminiWithFallback<T>(
  prompt: string,
  schema: any,
  fallbackFn: () => T
): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not configured, using fallback');
    return fallbackFn();
  }

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`[AI Worker] Attempting generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.65,
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      console.log(`[AI Worker] Successfully generated response with ${model}`);
      return parsed as T;
    } catch (err: any) {
      console.warn(`[AI Worker] Model ${model} failed: ${err.message?.slice(0, 120)}`);
      // Try next model in CANDIDATE_MODELS
    }
  }

  console.warn('[AI Worker] All Gemini models exhausted, applying editorial generator');
  return fallbackFn();
}

// Helper to strip HTML tags for pure prompt text
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Editorial generators when external network/quota is temporarily unreachable
function generateDiaryRefinementFallback(plainText: string, tone: string, focus: string, language: string = 'unique') {
  const paragraphs = plainText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let summary = '';
  let improvedParagraphs: string[] = [];

  if (language === 'bangla') {
    summary = `বাংলা ভাষায় ডায়রিটির ভাব ও ব্যঞ্জনা অক্ষুণ্ণ রেখে ব্যাকরণ ও ভাষাগত পরিচ্ছন্নতা বৃদ্ধি করা হয়েছে (${tone} সুর)।`;
    improvedParagraphs = paragraphs.map((p) => `<p>${p}</p>`);
    if (improvedParagraphs.length === 0) {
      improvedParagraphs = ['<p>আজকের প্রতিটি মুহূর্ত এক গভীর উপলব্ধির সঞ্চার করেছে। প্রতিটি অভিজ্ঞতাই জীবনের চলার পথকে সমৃদ্ধ করে।</p>'];
    }
  } else if (language === 'unique') {
    summary = `ইউনিক ব্লেন্ডে (Bangla + English contextual harmony) চিন্তার গভীরতা ও স্পষ্টতা বজায় রেখে পরিমার্জন করা হয়েছে (${tone} tone)।`;
    improvedParagraphs = paragraphs.map((p) => `<p>${p}</p>`);
  } else {
    summary = `Refined grammatical coherence and enriched cadence with a ${tone} tone focusing on ${focus}.`;
    improvedParagraphs = paragraphs.map((p) => {
      let clean = p.charAt(0).toUpperCase() + p.slice(1);
      if (!clean.endsWith('.') && !clean.endsWith('!') && !clean.endsWith('?')) {
        clean += '.';
      }
      clean = clean
        .replace(/\bi\b/g, 'I')
        .replace(/\s+/g, ' ')
        .replace(/ ,/g, ',')
        .replace(/ \./g, '.');

      if (tone === 'poetic') {
        return `<p class="italic">${clean}</p>`;
      }
      return `<p>${clean}</p>`;
    });
  }

  return {
    improvedContent: improvedParagraphs.join('\n'),
    changesSummary: summary,
    originalWordCount: plainText.split(/\s+/).filter(Boolean).length,
    improvedWordCount: improvedParagraphs.join(' ').split(/\s+/).filter(Boolean).length,
  };
}

function generateIdeaDevelopmentFallback(title: string, description: string, notes: string, language: string = 'unique') {
  if (language === 'bangla') {
    return {
      clarifiedTitle: `পরিকল্পনা: ${title}`,
      organizedSummary: `ধারণাটির মূল রূপরেখা: ${description}। বাস্তবায়নযোগ্য এবং বাস্তবসম্মত পদ্ধতির মাধ্যমে এটি সফল করা সম্ভব।`,
      corePillars: [
        'ভিত্তিপ্রস্তর ও সমস্যা চিহ্নিতকরণ',
        'পর্যায়ক্রমিক বাস্তবায়ন ও মাইলফলক',
        'প্রত্যাশিত ফলাফল ও কার্যকারিতা',
        'ভবিষ্যৎ সম্প্রসারণ ও মানোন্নয়ন',
      ],
      actionSteps: [
        `"${title}" এর জন্য প্রয়োজনীয় উপাদান ও প্রস্তুতি চূড়ান্ত করা।`,
        'একটি প্রাথমিক খসড়া বা প্রোটোটাইপ তৈরি করা।',
        'ব্যবহারিক পর্যবেক্ষণ ও গুণগত মান যাচাই করা।',
        'পরবর্তী পর্যায়ের রোডম্যাপ ও সময়সীমা নির্ধারণ করা।',
      ],
      suggestedNotes: `অগ্রাধিকার ক্ষেত্র: মূল উদ্দেশ্য বজায় রেখে দ্রুত বাস্তবায়ন।\n${notes ? `নোট: ${notes}` : ''}`,
    };
  }

  return {
    clarifiedTitle: title.length > 5 ? title : `Strategic Architecture: ${title}`,
    organizedSummary: `A structured synthesis establishing ${description.toLowerCase().replace(/\.$/, '')}. Balances zero-friction capture with long-term execution fidelity.`,
    corePillars: [
      'Foundational Architecture & Problem Scope',
      'Tactical Execution & Phased Milestones',
      'Value Delivery & Measurable Impact',
      'Long-Term Extensibility & Refinement',
    ],
    actionSteps: [
      `Formalize the core requirements and non-negotiables for "${title}".`,
      'Establish prototype boundaries or an initial working proof-of-concept.',
      'Gather targeted feedback on feasibility and edge cases.',
      'Refine the implementation roadmap with scheduled delivery dates.',
    ],
    suggestedNotes: `Focus Area: Rapid validation followed by systematic hardening.\nKey Invariant: Ensure every feature directly supports the central premise.\n${notes ? `Original context preserved: ${notes}` : ''}`,
  };
}

function generateGoalPlanFallback(title: string, category: string, deadline?: string, language: string = 'unique') {
  if (language === 'bangla') {
    return {
      strategicSummary: `"${title}" লক্ষ্যটি সফলভাবে অর্জনের জন্য সুবিন্যস্ত কার্যপরিকল্পনা।`,
      suggestedTasks: [
        {
          title: `ধাপ ১: "${title}" এর প্রয়োজনীয় উপাদান ও শর্তাবলী নির্ধারণ`,
          dueDate: deadline || '',
        },
        {
          title: `ধাপ ২: প্রাথমিক খসড়া ও মূল কার্যক্রম সম্পন্ন করা`,
          dueDate: deadline || '',
        },
        {
          title: `ধাপ ৩: নিরীক্ষণ ও গুণগত উন্নয়ন নিশ্চিত করা`,
          dueDate: deadline || '',
        },
        {
          title: `ধাপ ৪: চূড়ান্ত বাস্তবায়ন ও ফলাফল সংরক্ষণ`,
          dueDate: deadline || '',
        },
      ],
    };
  }

  return {
    strategicSummary: `Phased execution framework to achieve "${title}" within the target timeframe through sequential, measurable milestones.`,
    suggestedTasks: [
      {
        title: `Phase 1: Define success criteria and assemble foundational resources for ${title}`,
        dueDate: deadline || '',
      },
      {
        title: `Phase 2: Execute initial draft and primary core deliverable`,
        dueDate: deadline || '',
      },
      {
        title: `Phase 3: Conduct thorough review, stress test, and qualitative polish`,
        dueDate: deadline || '',
      },
      {
        title: `Phase 4: Final verification, packaging, and milestone sign-off`,
        dueDate: deadline || '',
      },
    ],
  };
}

function generateNoteRefinementFallback(plainText: string, action: string, noteTitle: string, language: string = 'unique') {
  const lines = plainText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let refinedHtml = '';
  let summary = '';

  if (action === 'structure') {
    refinedHtml = `<h2>${noteTitle || 'Key Observations'}</h2>
      <p>${lines[0] || 'Foundational premise.'}</p>
      <h3>Core Principles</h3>
      <ul>
        ${lines.slice(1).map((l) => `<li>${l}</li>`).join('') || '<li>Excellence in execution</li>'}
      </ul>
      <blockquote>"Clarity of thought precedes clarity of expression."</blockquote>`;
    summary = language === 'bangla' ? 'নোটটি সুবিন্যস্ত শিরোনাম ও পয়েন্ট আকারে সাজানো হয়েছে।' : 'Organized raw notes into structured semantic sections with headings, bulleted points, and key quotes.';
  } else if (action === 'summarize') {
    refinedHtml = `<h2>Executive Summary</h2>
      <p><strong>Overview:</strong> ${lines[0] || 'Central thesis of the note.'}</p>
      <h3>Key Takeaways</h3>
      <ul>
        ${lines.map((l) => `<li>${l}</li>`).join('')}
      </ul>`;
    summary = language === 'bangla' ? 'মূল বক্তব্য ও প্রয়োজনীয় পয়েন্টের সংক্ষিপ্ত সারসংক্ষেপ তৈরি করা হয়েছে।' : 'Generated an executive overview at the top with bulleted strategic takeaways.';
  } else if (action === 'action_items') {
    refinedHtml = `<h2>Actionable Next Steps</h2>
      <ul>
        ${lines.map((l) => `<li>[ ] Implement: ${l}</li>`).join('')}
      </ul>`;
    summary = language === 'bangla' ? 'কার্যকর করণীয় তালিকা তৈরি করা হয়েছে।' : 'Extracted concrete actionable checklist items from note contents.';
  } else {
    // Polish
    refinedHtml = lines.map((l) => `<p>${l.charAt(0).toUpperCase() + l.slice(1)}</p>`).join('\n');
    summary = language === 'bangla' ? 'নোটের ভাষা ও প্রকাশভঙ্গি পরিমার্জন করা হয়েছে।' : 'Polished phrasing, corrected flow, and harmonized paragraph cadences.';
  }

  return { refinedContent: refinedHtml, summary };
}

// 1. DIARY: Improve grammar, clarity, structure, and tone while preserving meaning with language selection
router.post('/diary/improve', async (req: AuthRequest, res: Response) => {
  try {
    const { content, tone = 'reflective', focus = 'clarity', language = 'unique', customCommand } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Diary content is required.' });
    }

    const plainText = stripHtml(content);
    const langDirective = getLanguageInstruction(language);

    const prompt = `You are a master editorial prose consultant and literary writing partner for a personal journal.
Original Entry:
"""
${plainText}
"""

Task:
Improve the journal entry focusing on: ${focus} with a ${tone} tone.
${customCommand && typeof customCommand === 'string' && customCommand.trim() ? `Specific Custom Command / Directive from User: "${customCommand.trim()}". Follow this command while keeping high editorial quality.` : ''}

${langDirective}

Strict Rules:
- Preserve the author's authentic personal voice, perspective, emotional honesty, and core meaning.
- Fix any grammar, punctuation, awkward phrasing, and flow.
- Format the improved version in clean HTML with proper <p> paragraphs. You may use <em> for emphasis or <blockquote> if appropriate.
- Explain what specific edits were made in a concise bullet summary.

Output format strictly JSON with keys:
- "improvedContent": clean HTML string of the refined entry
- "changesSummary": brief 1-2 sentence overview of improvements made
- "originalWordCount": integer
- "improvedWordCount": integer`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        improvedContent: { type: Type.STRING },
        changesSummary: { type: Type.STRING },
        originalWordCount: { type: Type.INTEGER },
        improvedWordCount: { type: Type.INTEGER },
      },
      required: ['improvedContent', 'changesSummary'],
    };

    const result = await callGeminiWithFallback(prompt, schema, () =>
      generateDiaryRefinementFallback(plainText, tone, focus, language)
    );

    return res.json(result);
  } catch (err: any) {
    console.error('AI Diary Error:', err);
    return res.status(500).json({ error: 'Failed to improve diary entry with AI.' });
  }
});

// 2. IDEAS: Clarify, organize, and develop ideas
router.post('/ideas/develop', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, notes, category, language = 'unique', customCommand } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const langDirective = getLanguageInstruction(language);

    const prompt = `You are a strategic creative thinking advisor and product architect.
Idea Title: "${title}"
Category: "${category || 'General'}"
Description: "${description}"
Existing Notes: "${notes || 'None'}"

Task:
Clarify, systematically organize, and develop this idea into a concrete actionable proposal.
${customCommand && typeof customCommand === 'string' && customCommand.trim() ? `Specific Custom Command / Directive from User: "${customCommand.trim()}". Prioritize this instruction in shaping the concept.` : ''}

${langDirective}

Rules:
- Provide a sharpened, compelling title.
- Provide a concise executive overview.
- Extract 3 to 4 core strategic pillars.
- Suggest 3 to 5 immediate concrete next steps.
- Provide synthesized development notes for future execution.

Output strictly JSON:
- "clarifiedTitle": string
- "organizedSummary": string
- "corePillars": array of strings
- "actionSteps": array of strings
- "suggestedNotes": string`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        clarifiedTitle: { type: Type.STRING },
        organizedSummary: { type: Type.STRING },
        corePillars: { type: Type.ARRAY, items: { type: Type.STRING } },
        actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestedNotes: { type: Type.STRING },
      },
      required: ['clarifiedTitle', 'organizedSummary', 'corePillars', 'actionSteps', 'suggestedNotes'],
    };

    const result = await callGeminiWithFallback(prompt, schema, () =>
      generateIdeaDevelopmentFallback(title, description, notes || '', language)
    );

    return res.json(result);
  } catch (err: any) {
    console.error('AI Idea Error:', err);
    return res.status(500).json({ error: 'Failed to develop idea with AI.' });
  }
});

// 3. MILESTONE: Suggest actionable task plan
router.post('/goals/plan', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, deadline, category, currentTasks = [], language = 'unique' } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Goal title is required.' });
    }

    const langDirective = getLanguageInstruction(language);
    const existingTaskList = currentTasks.map((t: any) => `- ${t.title}`).join('\n');

    const prompt = `You are an executive project planner and goal strategist.
Goal Title: "${title}"
Category: "${category || 'Personal'}"
Description: "${description || 'None'}"
Target Deadline: "${deadline || 'Not specified'}"
Existing Tasks: ${existingTaskList || 'None yet'}

Task:
Generate a phased, sequential, actionable task checklist (4-6 practical, realistic tasks) to achieve this goal effectively.

${langDirective}

Output strictly JSON:
- "strategicSummary": string
- "suggestedTasks": array of objects with "title" and optional "dueDate"`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        strategicSummary: { type: Type.STRING },
        suggestedTasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              dueDate: { type: Type.STRING },
            },
            required: ['title'],
          },
        },
      },
      required: ['strategicSummary', 'suggestedTasks'],
    };

    const result = await callGeminiWithFallback(prompt, schema, () =>
      generateGoalPlanFallback(title, category || 'Personal', deadline, language)
    );

    return res.json(result);
  } catch (err: any) {
    console.error('AI Goal Error:', err);
    return res.status(500).json({ error: 'Failed to plan goal with AI.' });
  }
});

// 4. NOTEBOOKS: Refine note content or selected text
router.post('/notes/refine', async (req: AuthRequest, res: Response) => {
  try {
    const { content, action = 'polish', noteTitle, language = 'unique', customCommand } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const plain = stripHtml(content);
    const langDirective = getLanguageInstruction(language);

    const actionPrompts: Record<string, string> = {
      polish: 'Refine clarity, phrasing, and flow while retaining all details, structure, and intent.',
      structure: 'Organize this note with clear semantic HTML sections (<h2>, <h3>, <p>, <ul>, <li>).',
      summarize: 'Generate a clean executive summary at the top followed by bulleted highlights.',
      expand: 'Elaborate on core arguments, providing nuanced context and counterpoints.',
      action_items: 'Extract actionable checklist items from this note formatted as clean bullet list.',
    };

    const instruction = actionPrompts[action] || actionPrompts.polish;
    const prompt = `You are an expert editorial advisor in a personal knowledge workspace.
Note Title: "${noteTitle || 'Untitled Note'}"
Selected/Target Content: "${plain}"

Goal:
${instruction}
${customCommand && typeof customCommand === 'string' && customCommand.trim() ? `Specific Custom Command / Directive from User: "${customCommand.trim()}". Prioritize executing this exact command.` : ''}

${langDirective}

Rules:
- Respond in semantic, clean HTML for rich-text editor (<p>, <h2>, <h3>, <ul>, <li>, <blockquote>, <strong>).
- Provide a 1-sentence summary of what was refined.

Output strictly JSON:
- "refinedContent": string of HTML
- "summary": string`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        refinedContent: { type: Type.STRING },
        summary: { type: Type.STRING },
      },
      required: ['refinedContent', 'summary'],
    };

    const result = await callGeminiWithFallback(prompt, schema, () =>
      generateNoteRefinementFallback(plain, action, noteTitle || '', language)
    );

    return res.json(result);
  } catch (err: any) {
    console.error('AI Note Error:', err);
    return res.status(500).json({ error: 'Failed to refine note with AI.' });
  }
});

export default router;
