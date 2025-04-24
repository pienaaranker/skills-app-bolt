export const curriculumPrompt = (
  skill: string,
  experienceLevel: string,
  quizResults?: string
) => {
  let experienceContext = `The target experience level is ${experienceLevel}.`;
  if (experienceLevel === 'custom') {
    if (quizResults) {
      experienceContext = `The user's experience level was assessed via a quiz. Here's a summary of their results or assessed level: ${quizResults}. Tailor the curriculum accordingly.`;
    } else {
      experienceContext = `The target experience level is 'custom', but no specific quiz results were provided. Assume a level slightly above beginner or use general knowledge to create a foundational but adaptable curriculum.`;
    }
  }

  // UPDATED: Schema description to include assignments
  const schemaDescription = `{
    \"skill\": \"string\", \"experienceLevel\": \"string\",
    \"curriculum\": { \"title\": \"string\", \"description\": \"string\", 
      \"modules\": [ { \"title\": \"string\", \"description\": \"string\", 
        \"steps\": [ { \"title\": \"string\", \"description\": \"string\", \"estimated_time\": \"string?", 
          \"resources\": [ { \"title\": \"string\", \"url\": \"string (valid URL)\" } ]? 
        } ],
        \"assignment\": { \"title\": \"string\", \"description\": \"string\", \"estimated_time\": \"string?" }? // Added assignment structure
      } ] 
    }
  }`;

  // UPDATED Prompt: Reordered and reinforced assignment instruction
  const prompt = `
Act as an expert curriculum designer for the skill: \"${skill}\".
${experienceContext}

Generate a detailed, step-by-step learning curriculum.

The curriculum MUST:
1. **For EACH module, include a practical assignment.** The assignment should have a title, a description of the task, and optionally an estimated completion time. The assignment should be designed to help the user actively apply or reinforce the knowledge/skills covered in that specific module.
2. Be structured into logical modules and steps with titles and descriptions.
3. Include links to relevant, currently accessible, and genuinely free online learning resources (articles, documentation, tutorials) where appropriate for steps. Ensure all provided URLs are valid and lead to the actual free resource. Leverage search capabilities to verify this. Do not invent URLs. Prioritize official documentation and reputable free learning platforms. If a suitable free resource cannot be found or verified for a step, omit the resource for that step.
4. Return ONLY the raw JSON object conforming to the structure below. Do NOT include any introductory text, explanations, apologies, or markdown code fences (like \`\`\`json) surrounding the JSON output.

The required JSON structure includes modules, steps, resources, and crucially, an 'assignment' object within each module:
\`\`\`json
${schemaDescription}
\`\`\`

Your entire response must be JUST the JSON object itself.
  `;

  return prompt;
}; 