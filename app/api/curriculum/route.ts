import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// Use Server Auth Helpers for route handlers
import { createServerClient } from '@supabase/ssr' // Removed CookieOptions as we won't use set/remove here
// Removed cookies import as we use request.cookies
import type { SupabaseClient } from '@supabase/supabase-js'; // Import base client type
// import type { Database } from '@/lib/database.types'; // Assuming you have generated types
type Database = any; // Use any as temporary fallback for Database types

// Define the expected structure for a single resource
const ResourceSchema = z.object({
  title: z.string().describe("Brief title of the learning resource"),
  url: z.string().url({ message: "Invalid URL format" }).describe("Direct URL to the free learning resource"),
});

// Define the expected structure for a single step within a module
const StepSchema = z.object({
  title: z.string().describe("Concise title for this learning step"),
  description: z.string().describe("Brief description of what to learn or do in this step"),
  estimated_time: z.string().optional().describe("Optional estimated time to complete (e.g., '1 hour', '30 minutes')"),
  resources: z.array(ResourceSchema).optional().describe("List of free resources for this step"),
});

// Define the expected structure for a single module
const ModuleSchema = z.object({
  title: z.string().describe("Title of the learning module"),
  description: z.string().describe("Brief overview of the module's content"),
  steps: z.array(StepSchema).describe("Ordered list of steps within the module"),
});

// Define the overall curriculum structure that the API will return
const CurriculumResponseSchema = z.object({
  skill: z.string().describe("The skill the curriculum is for"),
  experienceLevel: z.string().describe("The target experience level used for generation"),
  curriculum: z.object({
    title: z.string().describe("Overall title for the generated curriculum"),
    description: z.string().describe("Brief overview of the entire curriculum"),
    modules: z.array(ModuleSchema).describe("Ordered list of learning modules"),
  }),
});

// Define the request body schema expected by this API route
const RequestBodySchema = z.object({
  skill: z.string().min(1, { message: 'Skill name is required' }),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'custom']),
  quizResults: z.string().optional().describe("Stringified results or summary from the custom assessment quiz, used if experienceLevel is 'custom'"),
});

// Type alias for the inferred type of the response schema
export type CurriculumResponseType = z.infer<typeof CurriculumResponseSchema>;

// --- Gemini API Initialization ---
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Use a stable, available model
}) : null;

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 8192,
  responseMimeType: "application/json", // Request JSON output directly
};

// Safety settings to block harmful content
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- API Route Handler ---
export async function POST(req: NextRequest) {
  // Check if Gemini client failed to initialize (missing API key)
  if (!genAI || !model) {
    console.error("Error: Gemini API key not configured or client initialization failed.");
    return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
  }

  try {
    // --- 1. Input Validation ---
    let requestData;
    try {
        requestData = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = RequestBodySchema.safeParse(requestData);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { skill, experienceLevel, quizResults } = validation.data;

    // --- 2. Construct the Prompt ---
    let experienceContext = `The target experience level is ${experienceLevel}.`;
    if (experienceLevel === 'custom') {
      if (quizResults) {
        experienceContext = `The user's experience level was assessed via a quiz. Here's a summary of their results or assessed level: ${quizResults}. Tailor the curriculum accordingly.`;
    } else {
        experienceContext = `The target experience level is 'custom', but no specific quiz results were provided. Assume a level slightly above beginner or use general knowledge to create a foundational but adaptable curriculum.`;
      }
    }

    // Dynamically create the schema description string for the prompt
    // NOTE: Zod's .openapi() method is not standard. We manually describe the expected structure.
    // For simplicity, we'll use a predefined string description, but ideally, this could be
    // generated or kept in sync with the Zod schema more robustly.
    const schemaDescription = `{
      "skill": "string (The skill the curriculum is for)",
      "experienceLevel": "string (The target experience level)",
      "curriculum": {
        "title": "string (Overall title for the curriculum)",
        "description": "string (Brief overview of the curriculum)",
        "modules": [
          {
            "title": "string (Title of the module)",
            "description": "string (Overview of the module)",
            "steps": [
              {
                "title": "string (Title of the step)",
                "description": "string (Description of the step)",
                "estimated_time": "string (Optional, e.g., '1 hour')",
                "resources": [
                  {
                    "title": "string (Title of the resource)",
                    "url": "string (Valid URL to the free resource)"
                  }
                ]
              }
            ]
          }
        ]
      }
    }`;

    const prompt = `
Generate a detailed, step-by-step learning curriculum for the skill: "${skill}".
${experienceContext}

The curriculum MUST:
1. Focus EXCLUSIVELY on high-quality, **free** online resources (articles, tutorials, official documentation, videos). Do NOT include paid courses, books requiring purchase, or subscription-locked content.
2. Be structured into logical modules, each containing numbered steps.
3. Each step MUST have a clear title and a brief description. Optionally include an estimated_time.
4. If a step includes resources, each resource MUST have a title and a valid, direct URL to the free content. Ensure URLs are functional.
5. Provide a suitable overall title and brief description for the curriculum.
6. Include the requested skill and experienceLevel in the final JSON output.

Return the response ONLY as a single, raw JSON object matching this exact structure:
\`\`\`json
${schemaDescription}
\`\`\`

IMPORTANT: Ensure the output is ONLY the JSON object, without any introductory text, comments, markdown formatting (like \`\`\`json markers outside the object itself), or explanations. The entire response should be parsable as JSON.
    `;

    // --- 3. Call Gemini API ---
    console.log(`Generating curriculum for skill: "${skill}", level: ${experienceLevel}`);
    const result = await model.generateContent({ 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    // --- 4. Process Response ---
    if (!result.response) {
      console.error("Gemini API call failed: No response object.", result);
      throw new Error('AI service failed to generate a response.');
    }

    const candidate = result.response.candidates?.[0];
    const responseText = candidate?.content?.parts?.[0]?.text;
    const blockReason = result.response.promptFeedback?.blockReason;

    if (!responseText) {
      console.error("Gemini API call failed: No text part in the response.", { candidate, feedback: result.response.promptFeedback });
      if (blockReason) {
        console.error(`Content generation blocked by safety settings. Reason: ${blockReason}`);
        // Return a user-friendly error indicating content moderation
        return NextResponse.json(
            { error: 'Content generation blocked', message: `The request was blocked due to safety settings: ${blockReason}` },
            { status: 400 }
        );
      }
      throw new Error('AI service returned an empty or incomplete response.');
    }

    // console.log("Raw Gemini Response Text:\n", responseText); // Uncomment for debugging

    // --- 5. Parse and Validate JSON ---
    let parsedCurriculum;
    try {
      // Corrected: Changed \n to \n in regex
      const cleanedText = responseText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsedCurriculum = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse JSON response from Gemini:", parseError);
      console.error("Raw Gemini Response that failed parsing:\n", responseText); // Log the raw response
      throw new Error('AI service returned response in an invalid JSON format.');
    }

    const validationResult = CurriculumResponseSchema.safeParse(parsedCurriculum);

    if (!validationResult.success) {
      console.error('Generated curriculum validation error:', validationResult.error.format());
      console.error("Data that failed validation:", parsedCurriculum); // Log the invalid data
      // Optionally: Log the prompt that led to this invalid data
      // console.error("Prompt used:", prompt);
      throw new Error('AI service response did not match the expected curriculum structure.');
    }

    // --- 6. TODO: Save to Database ---
    // At this point, validationResult.data contains the validated curriculum.
    // You would add logic here to get the user session and save the data to Supabase.
    // const userId = ... (get user ID from session)
    // await saveGeneratedCurriculum(supabaseClient, userId, skill, experienceLevel, quizResults, validationResult.data);

    // --- 7. Return Success Response --- 
    return NextResponse.json(validationResult.data, { status: 200 });

  } catch (error: any) {
    console.error("Error generating curriculum:", error);
    let message = error.message || 'An unexpected error occurred';
    let status = 500; // Default to Internal Server Error

    // Refine status based on error type
    if (message.includes('invalid JSON format')) {
        status = 502; // Bad Gateway (upstream service returned bad data)
        message = 'Failed to parse curriculum from AI service.';
    } else if (message.includes('expected curriculum structure')) {
        status = 502; // Bad Gateway
        message = 'AI service returned curriculum in an unexpected structure.';
    } else if (message.includes('AI service returned an empty or incomplete response')) {
         status = 502; // Bad Gateway
    } else if (message.includes('AI service failed to generate a response')) {
        status = 503; // Service Unavailable
    }
    // Note: Safety block errors are handled earlier and return 400

    return NextResponse.json(
      { error: 'Failed to generate curriculum', message: message },
      { status }
    );
  }
} 