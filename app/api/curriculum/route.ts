import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
// Use Server Auth Helpers for route handlers
import { createServerClient } from '@supabase/ssr' // Removed CookieOptions as we won't use set/remove here
// Removed cookies import as we use request.cookies
import type { SupabaseClient } from '@supabase/supabase-js'; // Import base client type
// import type { Database } from '@/lib/database.types'; // Assuming you have generated types
type Database = any; // Use any as temporary fallback for Database types
import { curriculumPrompt } from '@/lib/prompts/curriculumPrompt'; // Import the new prompt function

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

// *** NEW: Define the expected structure for a module assignment ***
const AssignmentSchema = z.object({
  title: z.string().describe("Concise title for the assignment"),
  description: z.string().describe("Brief description of the assignment task"),
  estimated_time: z.string().optional().describe("Optional estimated time to complete the assignment"),
});

// Define the expected structure for a single module
const ModuleSchema = z.object({
  title: z.string().describe("Title of the learning module"),
  description: z.string().describe("Brief overview of the module's content"),
  steps: z.array(StepSchema).describe("Ordered list of steps within the module"),
  // *** ADDED: Optional assignment field for each module ***
  assignment: AssignmentSchema.optional().describe("Practical assignment to reinforce module learning"),
});

// Define the overall curriculum structure that the API will return
const CurriculumResponseSchema = z.object({
  skill: z.string().describe("The skill the curriculum is for"),
  experienceLevel: z.string().describe("The target experience level used for generation"),
  curriculum: z.object({
    title: z.string().describe("Overall title for the generated curriculum"),
    description: z.string().describe("Brief overview of the entire curriculum"),
    modules: z.array(ModuleSchema).describe("Ordered list of learning modules"), // Now includes assignments within modules
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
const MODEL_NAME = process.env.NEXT_PUBLIC_GEMINI_MODEL;

// Check for required environment variables
if (!API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set.");
}
if (!MODEL_NAME) {
  console.error("CRITICAL ERROR: NEXT_PUBLIC_GEMINI_MODEL environment variable is not set.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI && MODEL_NAME ? genAI.getGenerativeModel({
  model: MODEL_NAME, // Use the validated variable
  tools: [{ googleSearch: {} } as any] // Cast to any
}) : null;

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 8192,
  // REMOVED responseMimeType: "application/json", as it conflicts with tool usage
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
  if (!genAI || !model) {
    console.error("Error: Gemini API key/client not configured.");
    return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
  }

  try {
    // --- 1. Input Validation ---
    let requestData;
    try { requestData = await req.json(); } catch (e) { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
    const validation = RequestBodySchema.safeParse(requestData);
    if (!validation.success) { return NextResponse.json({ error: 'Invalid request body', details: validation.error.format() }, { status: 400 }); }
    const { skill, experienceLevel, quizResults } = validation.data;

    // --- 2. Construct Prompt --- 
    let experienceContext = `The target experience level is ${experienceLevel}.`;
    if (experienceLevel === 'custom') {
      if (quizResults) {
        experienceContext = `The user's experience level was assessed via a quiz. Here's a summary of their results or assessed level: ${quizResults}. Tailor the curriculum accordingly.`;
    } else {
        experienceContext = `The target experience level is 'custom', but no specific quiz results were provided. Assume a level slightly above beginner or use general knowledge to create a foundational but adaptable curriculum.`;
      }
    }
    
    // ** UPDATED Prompt: Reordered and reinforced assignment instruction **
    const prompt = curriculumPrompt(skill, experienceLevel, quizResults);

    // --- 3. Single Gemini API Call --- 
    console.log(`[API /curriculum] Generating curriculum for skill: "${skill}", level: ${experienceLevel} (Using built-in search)`);
    
    // *** Simplified to a single generateContent call ***
    const result = await model.generateContent({ 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
      // tools are defined at model level now
    });

    const response = result.response;
    const responseText = response?.text?.();

    // --- 4. Process Response --- 
    if (!responseText) {
      console.error("Gemini API call failed: No text response received.", { response });
      const blockReason = response?.promptFeedback?.blockReason;
      if (blockReason) {
         return NextResponse.json({ error: 'Content generation blocked', message: `Request blocked by safety settings: ${blockReason}` }, { status: 400 });
      }
      throw new Error('AI service returned an empty or incomplete response.');
    }
    
    // Check for grounding metadata (optional, for logging/debugging)
    const groundingMetadata = response?.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata) {
        console.log("[API /curriculum] Grounding metadata found (Search likely used).");
        // console.log("Search Queries:", groundingMetadata.webSearchQueries); // Log queries if needed
    } else {
        console.log("[API /curriculum] No grounding metadata found (Search might not have been triggered or successful).");
    }

    // console.log("Raw Gemini Response Text:\n", responseText); // Debugging

    // --- 5. Parse and Validate JSON --- 
    let parsedCurriculum;
    try {
      // Enhanced cleanup of the response text
      const cleanedText = responseText
        .trim()
        // Remove any markdown code fences
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        // Remove any trailing commas before closing braces/brackets
        .replace(/,(\s*[}\]])/g, '$1')
        // Handle potential line breaks and formatting
        .replace(/\n\s*/g, ' ')
        .trim();

      parsedCurriculum = JSON.parse(cleanedText);

      // Log the parsed structure for debugging
      console.log('Successfully parsed curriculum structure:', {
        hasSkill: !!parsedCurriculum.skill,
        hasExperienceLevel: !!parsedCurriculum.experienceLevel,
        moduleCount: parsedCurriculum.curriculum?.modules?.length,
        firstModuleHasAssignment: !!parsedCurriculum.curriculum?.modules?.[0]?.assignment
      });

    } catch (parseError) {
      console.error("Failed to parse JSON response from Gemini:", parseError);
      console.error("Raw Gemini Response that failed parsing:\n", responseText);
      throw new Error('AI service returned response in an invalid JSON format.');
    }

    // Validate the structure
    const validationResult = CurriculumResponseSchema.safeParse(parsedCurriculum);
    if (!validationResult.success) {
      console.error('Generated curriculum validation error:', validationResult.error.format());
      console.error("Data that failed validation:", parsedCurriculum);
      throw new Error('AI service response did not match the expected curriculum structure.');
    }

    // --- 6. Return Success Response --- 
    return NextResponse.json(validationResult.data, { status: 200 });

  } catch (error: any) {
    console.error("Error generating curriculum:", error);
    let message = error.message || 'An unexpected error occurred';
    let status = 500; 
    if (message.includes('invalid JSON format')) status = 502; 
    else if (message.includes('expected curriculum structure')) status = 502;
    else if (message.includes('empty or incomplete response')) status = 502;
    else if (message.includes('AI service failed')) status = 503;
    return NextResponse.json({ error: 'Failed to generate curriculum', message }, { status });
  }
} 