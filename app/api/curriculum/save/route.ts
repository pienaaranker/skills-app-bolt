import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CurriculumResponseType } from '../route'; // Import only the type

// --- Re-define Zod Schemas for Validation within this route ---
// (Copied from ../route.ts for self-containment and clarity)
const ResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

const StepSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimated_time: z.string().optional(),
  resources: z.array(ResourceSchema).optional(),
});

const ModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  steps: z.array(StepSchema),
});

// Define the expected request body schema for saving - matching CurriculumResponseType
const SaveRequestBodySchema = z.object({
  skill: z.string(),
  experienceLevel: z.string(), // Keep level used for generation context
  curriculum: z.object({
    title: z.string(),
    description: z.string(),
    modules: z.array(ModuleSchema),
  }),
});
// --- End Zod Schema Definitions ---

type Database = any; // Use any as temporary fallback for Database types

// --- Database Saving Logic (CORRECTED based on 20250422051617_azure_star.sql) --- 
async function saveCurriculumToDb(
  supabase: any, // Replace 'any' with SupabaseClient<Database> if types are generated
  userId: string,
  dataToSave: CurriculumResponseType // Use the imported type here
): Promise<string> { // Returns the new curriculumId (UUID as string)
  
  console.log("Starting database save process for user:", userId);

  const { skill: skillNameRaw, experienceLevel, curriculum } = dataToSave;
  const skillName = skillNameRaw.trim(); // Ensure skill name is trimmed

  // --- 1. Upsert Skill --- 
  console.log("[Save DB] Attempting to upsert skill:", { skill_name: skillName, user_id: userId, experience_level: experienceLevel });
  const { data: skillData, error: skillError } = await supabase
    .from('skills')
    .upsert(
        { 
            skill_name: skillName, 
            user_id: userId,       
            experience_level: experienceLevel,
            current_step: 0,
            total_steps: curriculum.modules?.reduce((total, mod) => total + (mod.steps?.length || 0), 0) || 0,
            completed: false
        },
        { 
            onConflict: 'user_id, skill_name',
        }
    )
    .select('id')
    .single();

  // Log detailed results for skill upsert
  console.log("[Save DB] Skill Upsert Result:", { skillData, skillError });

  if (skillError || !skillData?.id) { // Check specifically for skillData.id
    console.error("Skill Upsert Failed:", skillError);
    const message = skillError?.message.includes('violates row-level security policy') 
        ? `RLS policy violation: Cannot save skill '${skillName}' for this user.`
        : `Failed to find or create skill '${skillName}'. Error: ${skillError?.message || 'No skill ID returned'}`;
    throw new Error(message);
  }
  const skillId = skillData.id;
  console.log(`[Save DB] Upserted skill_id: ${skillId}`);

  // --- 2. Insert Curriculum Record --- 
  const curriculumInsertData = {
    user_id: userId,
    skill_id: skillId, 
    title: curriculum.title,
    description: curriculum.description,
    modules: curriculum.modules,
    experience_level: experienceLevel
  };
  console.log("[Save DB] Attempting to insert curriculum:", curriculumInsertData);
  const { data: curriculumBaseData, error: curriculumError } = await supabase
    .from('curricula')
    .insert(curriculumInsertData)
    .select('id')
    .single();

  // Log detailed results for curriculum insert
  console.log("[Save DB] Curriculum Insert Result:", { curriculumBaseData, curriculumError });

  if (curriculumError || !curriculumBaseData?.id) { // Check specifically for curriculumBaseData.id
    console.error("Curriculum Insert Failed:", curriculumError);
    throw new Error(`Failed to save curriculum base record. Error: ${curriculumError?.message || 'No curriculum ID returned'}`);
  }
  const curriculumId = curriculumBaseData.id;
  console.log(`[Save DB] Saved curriculum_id: ${curriculumId}`);

  // --- 3. Insert Assignments ---
  const assignments = curriculum.modules
    .map((module, moduleIndex) => {
      if (!module.assignment) return null;
      return {
        skill_id: skillId,
        module_index: moduleIndex,
        step_index: -1, // -1 indicates this is a module-level assignment
        title: module.assignment.title,
        description: module.assignment.description,
        completed: false
      };
    })
    .filter(assignment => assignment !== null);

  if (assignments.length > 0) {
    console.log("[Save DB] Attempting to insert assignments:", assignments);
    const { error: assignmentsError } = await supabase
      .from('assignments')
      .insert(assignments);

    if (assignmentsError) {
      console.error("Assignments Insert Failed:", assignmentsError);
      // Don't throw error here - we'll still return the curriculum ID even if assignments fail
      // But log it for monitoring
      console.warn("Failed to save assignments but curriculum was saved successfully");
    } else {
      console.log(`[Save DB] Successfully saved ${assignments.length} assignments`);
    }
  }

  console.log("Database save process completed successfully for curriculum ID:", curriculumId);
  return curriculumId; // Return the ID (UUID string)
}

// --- API Route Handler ---
export async function POST(req: NextRequest) {
  const cookieStore = await cookies(); 
  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
          cookies: {
              get(name: string) {
                  return cookieStore.get(name)?.value;
              },
              set(name: string, value: string, options: CookieOptions) {
                  try {
                      cookieStore.set(name, value, options);
                  } catch (error) {
                      console.error("Route Handler: Failed to set cookie", name, error);
                  }
              },
              remove(name: string, options: CookieOptions) {
                  try {
                      cookieStore.set(name, '', options);
                  } catch (error) {
                      console.error("Route Handler: Failed to remove cookie", name, error);
                  }
              },
          },
      }
  );

  try {
      // 1. Authentication - Using getUser()
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
          console.error("Authentication Error:", authError);
          return NextResponse.json({ error: authError?.message || 'Not authenticated' }, { status: 401 });
      }
      const userId = user.id;
      console.log("Authenticated User ID:", userId);

      // 2. Input Validation
      let rawBody;
      try {
          rawBody = await req.json();
      } catch (e) {
          return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
      const validation = SaveRequestBodySchema.safeParse(rawBody);
      if (!validation.success) {
          return NextResponse.json(
              { error: 'Invalid request body structure', details: validation.error.format() },
              { status: 400 }
          );
      }
      const curriculumData: CurriculumResponseType = validation.data as CurriculumResponseType;

      // 3. Save to Database (using corrected function)
      const newCurriculumId = await saveCurriculumToDb(supabase, userId, curriculumData);

      // 4. Return Success Response
      return NextResponse.json({ curriculumId: newCurriculumId }, { status: 201 });

  } catch (error: any) {
      console.error("Error saving curriculum:", error);
      return NextResponse.json(
          { error: 'Failed to save curriculum', message: error.message || 'Internal server error' },
          { status: 500 }
      );
  }
} 