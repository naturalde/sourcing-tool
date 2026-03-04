import { NextRequest, NextResponse } from 'next/server';

const AI_ENRICHMENT_PROMPT = `You are a senior industrial designer working for a global product sourcing company. Your task is to analyze the uploaded product image and propose alternative design concepts that could be manufactured and sold as product variations.

INPUTS  
- Product Image: (attached automatically)  
- User Notes (optional): {{user_notes}}

OBJECTIVES  
1. Identify what the original product is.  
2. Generate a concise title and description for the original product.  
3. Create multiple alternative product design concepts inspired by the original item.

Alternative concepts should be:
- manufacturable at scale
- visually differentiated
- commercially appealing for e-commerce
- simple enough for factories to produce

You may modify:
- shape
- theme or character
- materials
- colors
- emotional tone
- function or usability
- gifting appeal

OUTPUT FORMAT (JSON)

{
  "original_product": {
    "title": "<short title under 8 words>",
    "description": "<short description under 20 words>"
  },
  "design_alternatives": [
    {
      "concept_title": "<short name>",
      "generated_image_prompt": "<visual description for generating the alternative product image>",
      "short_description": "<under 20 words>",
      "design_rationale": "<why this design is compelling or commercially interesting>"
    },
    {
      "concept_title": "",
      "generated_image_prompt": "",
      "short_description": "",
      "design_rationale": ""
    },
    {
      "concept_title": "",
      "generated_image_prompt": "",
      "short_description": "",
      "design_rationale": ""
    }
  ]
}

GUIDELINES

- Generate 3–5 alternative concepts.
- Keep designs practical for manufacturing.
- Avoid unrealistic materials or extremely complex structures.
- Alternative concepts should be meaningfully different from the original product.
- Favor ideas that could perform well as gift items or viral e-commerce products.`;

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, userNotes } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Prepare the prompt with user notes if provided
    const prompt = AI_ENRICHMENT_PROMPT.replace('{{user_notes}}', userNotes || 'None provided');

    // Call Gemini API
    const result = await callGemini(imageUrl, prompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI enrichment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to enrich product with AI', details: errorMessage },
      { status: 500 }
    );
  }
}

async function callGemini(imageUrl: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt + '\n\nPlease respond with valid JSON only, no additional text.',
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error response:', errorBody);
    throw new Error(`Gemini API error (${response.status}): ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  console.log('Gemini API response:', JSON.stringify(data, null, 2));
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Extract JSON from response (in case there's markdown formatting)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function callClaude(imageUrl: string, prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt + '\n\nPlease respond with valid JSON only, no additional text.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from Claude');
  }

  // Extract JSON from response (in case there's markdown formatting)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}
