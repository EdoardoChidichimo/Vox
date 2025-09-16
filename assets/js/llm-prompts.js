// LLM Prompts for VoxLLM
// Centralised storage for all prompts used in the LLM API calls
//
// To add new prompts:
// 1. Add the system message to systemMessages object
// 2. Add the prompt template to prompts object
// 3. Use placeholders like {variableName} for dynamic content
// 4. Update the corresponding method in llm-api.js to use the new prompt

const LLMPrompts = {
    // System messages for different roles
    systemMessages: {
        legalExpert: `You are a legal expert specialising in UK school exclusion law. Your role is to provide accurate, legally-informed analysis and guidance.`,
        
        schoolFactsSynthesis: `You are a legal expert specialising in UK school exclusion law. Your role is to synthesise information from multiple sources to create a clear, factual summary of the school's position in an exclusion case. Be objective, accurate, and focus on identifying key facts and evidence.`,
        
        exclusionReasonExtraction: `You are a legal expert specialising in UK school exclusion law. Your role is to extract and clearly state the specific reason(s) given for a school exclusion from official documentation. Be precise and identify all stated reasons.`,
        
        studentPerspectiveAnalysis: `You are a legal expert specialising in UK school exclusion law. Your role is to synthesise information about the student's perspective and whether proper procedures were followed.`

    },


    prompts: {
        synthesiseSchoolFacts: `Please synthesise the following information about a school exclusion case to create a clear summary of the school's position:

EXCLUSION LETTER CONTENT:
{exclusionLetterContent}

SCHOOL'S VERSION OF EVENTS:
{schoolVersionEvents}

SCHOOL'S EVIDENCE:
{schoolEvidence}

Please provide a synthesised summary that:
1. Identifies the key facts presented by the school
2. Highlights any inconsistencies or gaps in the information
3. Summarises the evidence provided
4. Presents the information in a clear, structured format

Focus on factual accuracy and avoid speculation. If there are contradictions between sources, note them clearly. Do NOT include any legal citations or references to statutes or other legal sources. Respond succinctly but without missing any information or detail. Respond ONLY with the summary as a paragraph, no other text or formatting.`,

        extractExclusionReason: `Please extract the specific reason(s) given for the school exclusion from the following exclusion letter:

EXCLUSION LETTER:
{exclusionLetterContent}

Please:
1. Identify the primary stated reason for the exclusion
2. Quote the exact language used in the letter where possible
3. Identify any specific incidents or dates mentioned

Respond succinctly but without missing any information or detail. Respond ONLY with a 1–3 sentence(s) summary, no other text or formatting. Do NOT include any legal citations or references to statutes or other legal sources.`,

        synthesiseParentsFacts: `Please synthesise the following information about a school exclusion case from the student's perspective:

STUDENT AGREES WITH SCHOOL'S VERSION: {studentAgreesWithSchool}

STUDENT'S VERSION OF EVENTS: {studentVersionEvents}

WITNESSES DETAILS: {witnessesDetails}

STUDENT VOICE HEARD DETAILS: {studentVoiceHeardDetails}

Please provide a synthesised analysis that:
1. Identifies any contradictions between school and student versions
2. Notes the availability and potential impact of witnesses

Respond succinctly but without missing any information or detail. Do NOT include any legal citations or references to statutes or other legal sources. Respond ONLY with the summary as a paragraph, no other text or formatting.`,

        generatePositionStatement: `
# KNOWLEDGE
Exclusion Reason: {exclusionReason}

School's Facts: {synthesisedSchoolFacts}

Student Perspective: {synthesisedParentsFacts}

Student Background: {backgroundSummary}

Case Stage Information: {stageInfo}

Other information provided: {otherInformationProvided}

# GUIDANCE DOCUMENTS
Suspensions Guidance: {suspensionsGuidance}

Behaviour in Schools Guidance: {behaviourInSchoolsGuidance}

# POSITION STATEMENT GROUNDS
{positionStatementGrounds}

# INSTRUCTIONS
Generate a position statement using the facts provided under **Knowledge**, the two attached statutory guidance documents, and the list of grounds (JSON format below). Follow these rules:

### Selection and Use of Grounds
- Select the **most relevant and important grounds** from the JSON.
- For each selected ground, analyse which conditions apply and build your argument using the provided suggested wordings and guidance.
- Do **not** mention "suggested wordings" explicitly — treat them as internal references and write in a natural style.
- You may add your own grounds if justified by the facts.

### Referencing
- If quoting relevant excerpts from position statement grounds, quote them **in full** (from the "content" field) in quotation marks, followed by the reference (from the "reference" field) in square brackets.
- If referencing from suspensions guidance, DocumentName should be "Exclusion Guidance".
- If referencing from behaviour in schools guidance, DocumentName should be "Behavioural Advice".
- Use this format for every reference where possible: "[Page/Paragraph/Part SPACE Number/NumberRange, DocumentName]" (ensure the comma is included).
- ALL references should be in square brackets.
- Never reference the suggested wordings as documents themselves.

### Structure and Formatting
- Present **4–6 numbered grounds of argument**.
- Each ground should include:
  - The "GROUND_TITLE" as the heading.
  - **3-5 bullet points**, written as short, connected paragraph-style points. You may use multiple sentences for each bullet point.
  - Entirely quoted excerpts should form their own bullet point and always as the first bullet point.

### Placeholders and Factual Integrity
- Use only these placeholders: "[CHILD_NAME, PARENT_NAME, SCHOOL_NAME, EXCLUSION_DATE, EXCLUSION_LETTER_DATE, STAGE]".
- Reference the child/pupil as the "young person" or replace with the [CHILD_NAME] placeholder.
- Replace placeholders with actual information where available, do not invent quotes if none are provided. If information is missing, remove the placeholder and adapt the wording (do not invent facts or quotes, only use the knowledge base).
- If a ground contains placeholders (usually in "<< >>"), replace them with the correct information (only if provided) or remove/adapt them (do not invent facts or quotes, only use the knowledge base).

### Output Constraints
- Do **not** include a title, header, introduction, summary, or concluding recommendation — output should consist only of the numbered grounds with their bullet points.
- Ensure all reasoning is **strictly relevant** to the facts and guidance provided.
- Do not assume or infer facts outside the knowledge base.

# YOUR RESPONSE:`,

        formatPositionStatement: `Please reformat the following position statement into **exactly** this JSON style:

{
  "grounds": [
    {
      "title": "Grounds Title 1",
      "reasons": [
        "Ground 1 paragraph 1",
        "Ground 1 paragraph 2",
        "Ground 1 paragraph 3"
      ]
    },
    {
      "title": "Grounds Title 2",
      "reasons": [
        "Ground 2 paragraph 1",
        "Ground 2 paragraph 2"
      ]
    },
    {
      "title": "Grounds Title 3",
      "reasons": [
        "Ground 3 paragraph 1",
        "Ground 3 paragraph 2"
      ]
    },
    {
      "title": "Grounds Title 4",
      "reasons": []
    }
  ]
}

Formatting rules:
- Do not add or remove grounds or paragraphs — only reformat as required.
- Preserve the original text of titles and paragraphs exactly, except for trimming leading/trailing whitespace.
- Replace placeholders in the position statement (including child name, parent name, school name, stage, exclusion date) with the following square bracket format: [childName], [parentName], [schoolName], [stage], [exclusionDate].
- Remove any bullet point markers like '-', '*', etc. and any formatting style characters like '*', '**', etc. for bold, italics, etc.
- Each paragraph should end with a period if it does not already have one.
- The text should be copied verbatim from the position statement, do not add or remove any text, just reformat as required (ensure that the ground titles are not in all-caps).
- **IMPORTANT: Convert all quotation marks to proper LaTeX format:**
  - Opening quotation marks should be: \`\`
  - Closing quotation marks should be: ''
  - For quoted text, use: \`\`quoted text here''
  - Never use straight quotes (") or smart quotes (" ")

{positionStatement}`
    },

    // Test prompts
    testPrompts: {
        connectionTest: {
            prompt: 'Hello, this is a test message. Please respond with "Connection successful" if you can see this.',
            systemMessage: 'You are a helpful assistant. Please respond briefly to test messages.'
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMPrompts;
} else {
    // Browser environment
    window.LLMPrompts = LLMPrompts;
}
