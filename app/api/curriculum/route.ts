import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// Use Server Auth Helpers for route handlers
import { createServerClient } from '@supabase/ssr' // Removed CookieOptions as we won't use set/remove here
// Removed cookies import as we use request.cookies
import type { SupabaseClient } from '@supabase/supabase-js'; // Import base client type
// import type { Database } from '@/lib/database.types'; // Assuming you have generated types
type Database = any; // Use any as temporary fallback for Database types

// Define the structure for quiz results (if provided)
const QuizResultSchema = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  rationale: z.string().optional(),
  answers: z.record(z.string(), z.string()).optional(),
}).nullable();

// Define the structure for the request body
const RequestBodySchema = z.object({
  skillName: z.string().min(1),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "custom"]),
  quizResults: QuizResultSchema, // Can be null if experienceLevel is not 'custom'
});

// Define the structure for curriculum response (matching Gemini needs)
const StepSchema = z.object({
  title: z.string(),
  resource_url: z.string().url().or(z.string()), // Allow non-URL initially, maybe refine later or add validation step
});

const ModuleSchema = z.object({
  title: z.string(),
  steps: z.array(StepSchema),
});

const CurriculumSchema = z.object({
  title: z.string(),
  modules: z.array(ModuleSchema),
});

const GeminiResponseSchema = z.object({
  curriculum: CurriculumSchema,
});

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const generationConfig = {
    responseMimeType: "application/json",
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Database Saving Logic --- 
// Extracted into a separate function for clarity
async function saveGeneratedCurriculum(
  supabase: SupabaseClient<Database>, // Use the base SupabaseClient type
  userId: string,
  skillName: string,
  experienceLevel: string,
  quizResults: z.infer<typeof QuizResultSchema> | null,
  curriculumData: z.infer<typeof GeminiResponseSchema>['curriculum']
): Promise<number> { // Returns the new curriculumId
  
  console.log("Starting database save process...");

  // 1. Upsert Skill
  const { data: skillData, error: skillError } = await supabase
    .from('skills')
    .upsert({ name: skillName }, { onConflict: 'name', ignoreDuplicates: false })
    .select('id')
    .single();

  if (skillError || !skillData) {
    console.error("Skill Upsert Error during save:", skillError);
    throw new Error("Failed to find or create skill during save.");
  }
  const skillId = skillData.id;
  console.log(`Saved skill_id: ${skillId}`);

  // 2. Insert Base Curriculum Record
  const { data: curriculumBaseData, error: curriculumError } = await supabase
    .from('curricula')
    .insert({
      user_id: userId,
      skill_id: skillId,
      experience_level: experienceLevel,
      // Add quiz assessment data if available (assuming a 'quiz_assessment' JSONB column)
      // quiz_assessment: experienceLevel === 'custom' ? quizResults : null,
      title: curriculumData.title // Save the generated title
    })
    .select('id')
    .single();

  if (curriculumError || !curriculumBaseData) {
    console.error("Curriculum Insert Error during save:", curriculumError);
    throw new Error("Failed to save curriculum base record.");
  }
  const curriculumId = curriculumBaseData.id;
  console.log(`Saved curriculum_id: ${curriculumId}`);

  // 3. Prepare and Insert Modules and Steps
  const modulesToInsert = curriculumData.modules.map((module, moduleIndex) => ({
    curriculum_id: curriculumId,
    title: module.title,
    module_order: moduleIndex, // Add order column
  }));

  const { data: insertedModules, error: moduleError } = await supabase
    .from('modules')
    .insert(modulesToInsert)
    .select('id, title'); // Select ID and title to map steps correctly

  if (moduleError || !insertedModules) {
    console.error("Module Insert Error:", moduleError);
    // TODO: Consider cleanup? Delete base curriculum record?
    throw new Error("Failed to save curriculum modules.");
  }
  console.log(`Saved ${insertedModules.length} modules.`);

  // Create a map for easy lookup of module ID by title
  const moduleIdMap = new Map(insertedModules.map(m => [m.title, m.id]));

  const stepsToInsert = curriculumData.modules.flatMap((module, moduleIndex) => {
    const moduleId = moduleIdMap.get(module.title);
    if (!moduleId) {
      console.warn(`Could not find saved module ID for module title: ${module.title}. Skipping its steps.`);
      return []; // Skip steps if module ID wasn't found (shouldn't happen ideally)
    }
    return module.steps.map((step, stepIndex) => ({
      module_id: moduleId,
      title: step.title,
      resource_url: step.resource_url,
      step_order: stepIndex, // Add order column
    }));
  });

  if (stepsToInsert.length > 0) {
    const { error: stepError } = await supabase
      .from('steps')
      .insert(stepsToInsert);

    if (stepError) {
      console.error("Step Insert Error:", stepError);
       // TODO: Consider cleanup? Delete modules and base record?
      throw new Error("Failed to save curriculum steps.");
    }
    console.log(`Saved ${stepsToInsert.length} steps.`);
  } else {
     console.log("No steps to insert.");
  }

  console.log("Database save process completed successfully.");
  return curriculumId; // Return the ID of the main curriculum record
}
// --- End Database Saving Logic ---

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
     return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Create Supabase client specific to this route handler using the simpler read-only pattern
  const supabaseRouteHandler = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        // No set/remove needed here for this pattern, assume middleware handles refresh
      },
    }
  )

  try {
     // --- 1. Authentication --- 
     // getSession might still attempt internal cookie operations if refresh needed
     const { data: { session }, error: sessionError } = await supabaseRouteHandler.auth.getSession();
     if (sessionError || !session?.user) {
       console.error("Auth Error:", sessionError);
       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
     }
     const userId = session.user.id;
     console.log("Authenticated User ID:", userId);
     // -------------------------

    // --- 2. Input Validation --- 
    const body = await req.json();
    const validation = RequestBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }
    const { skillName, experienceLevel, quizResults } = validation.data;
    // --------------------------

    // --- 3. Prompt Engineering --- 
    let context = ``;
    if (experienceLevel === 'custom' && quizResults) {
      context = `The user described their experience as 'custom'. Based on a quiz, their assessed level is **${quizResults.level}**. Rationale (if any): ${quizResults.rationale || 'N/A'}.`; // Removed quiz answers from prompt for brevity/focus
    } else {
      context = `The user described their experience level as **${experienceLevel}**.`;
    }

    // IMPORTANT: Explicitly ask for JSON format in the prompt
    const prompt = `Generate a structured learning curriculum for the skill \"${skillName}\". 
${context}

The curriculum should break the skill down into logical modules, and each module into actionable steps. Each step must include a link (resource_url) to a high-quality, free online resource (article, tutorial, documentation, video, etc.).

Return ONLY the raw JSON object (no markdown formatting like \`\`\`json) matching this exact structure:
{\n  \"curriculum\": {\n    \"title\": \"[Generated Curriculum Title]\",\n    \"modules\": [\n      {\n        \"title\": \"[Module 1 Title]\",\n        \"steps\": [\n          {\n            \"title\": \"[Step 1.1 Title]\",\n            \"resource_url\": \"[URL to free resource]\"\n          },\n          ...\n        ]\n      },\n      ...\n    ]\n  }\n}\n\nEnsure all resource_url fields contain valid URLs. Focus on free, high-quality resources. Output only the JSON object.`;

    console.log(`Generating curriculum for Skill: ${skillName}, User: ${userId}`);

    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash-latest" });
    
    const result = await model.generateContent({ 
        contents: [{ role: "user", parts: [{text: prompt}] }], 
        generationConfig: generationConfig,
        safetySettings: safetySettings,
    });
    const response = result.response;
    const responseText = response.text();

    // Since we requested JSON, parse directly
    const parsedGeminiJson = JSON.parse(responseText);
    console.log("Parsed Gemini JSON Response:", parsedGeminiJson); 

    // --- 5. Parse & Validate Gemini Response --- 
    // Validate the parsed JSON structure against our Zod schema
    const validatedResponse = GeminiResponseSchema.safeParse(parsedGeminiJson);

    if (!validatedResponse.success) {
      console.error("Gemini Response Validation Error:", validatedResponse.error.format());
      throw new Error('AI service response did not match expected structure.');
    }
    const curriculumData = validatedResponse.data.curriculum;
    // -----------------------------------------

    // --- 6. Save to Database --- 
    const newCurriculumId = await saveGeneratedCurriculum(
      supabaseRouteHandler,
      userId,
      skillName,
      experienceLevel,
      quizResults,
      curriculumData
    );
    // ---------------------------

    // --- 7. Return Success Response --- 
    return NextResponse.json({ 
        message: 'Curriculum generated successfully', 
        curriculumId: newCurriculumId, 
        curriculum: curriculumData // Optionally return the generated data
    });
    // ------------------------------

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 