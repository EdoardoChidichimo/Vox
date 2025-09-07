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
{exclusionLetter}

SCHOOL'S VERSION OF EVENTS (from parent input):
{schoolFactsInput}

SCHOOL'S EVIDENCE:
{schoolEvidenceInput}

Please provide a synthesised summary that:
1. Identifies the key facts presented by the school
2. Highlights any inconsistencies or gaps in the information
3. Summarises the evidence provided
4. Presents the information in a clear, structured format

Focus on factual accuracy and avoid speculation. If there are contradictions between sources, note them clearly. Do NOT include any legal citations or references to statutes or other legal sources. Respond succinctly but without missing any information or detail. Respond ONLY with the summary as a paragraph, no other text or formatting.`,

        extractExclusionReason: `Please extract the specific reason(s) given for the school exclusion from the following exclusion letter:

EXCLUSION LETTER:
{exclusionLetter}

Please:
1. Identify the primary stated reason for the exclusion
2. Quote the exact language used in the letter where possible
3. Identify any specific incidents or dates mentioned

Respond succinctly but without missing any information or detail. Respond ONLY with a 1–3 sentence(s) summary, no other text or formatting. Do NOT include any legal citations or references to statutes or other legal sources.`,

        synthesiseParentsFacts: `Please synthesise the following information about a school exclusion case from the student's perspective:

STUDENT AGREES WITH SCHOOL'S VERSION: {schoolFactsConfirm}

STUDENT'S VERSION OF EVENTS: {parentsFactsInput}

WITNESSES AVAILABLE: {parentsFactsWitnessesInput}

STUDENT VOICE HEARD BEFORE EXCLUSION: {isStudentVoiceHeard}

Please provide a synthesised analysis that:
1. Identifies any contradictions between school and student versions
2. Notes the availability and potential impact of witnesses

Respond succinctly but without missing any information or detail. Do NOT include any legal citations or references to statutes or other legal sources. Respond ONLY with the summary as a paragraph, no other text or formatting.`,

        generatePositionStatement: ` # INSTRUCTIONS 
Generate a position statement document (2–4 pages) using the most relevant grounds of arguments (listed in JSON format below) based on the facts of the case (under Knowledge), and use the two statutory guidance documents attached. From the JSON, pick the most relevant and important titles, from these analyse which conditions apply, and use the suggested wordings to fill out the points (the suggested wordings do not need to be verbatim and you should NOT reference "suggested wordings" explicitly, but use the relevant references). If referencing relevant excerpts, quote in full in quotation marks (from the "content" field) with the reference citation (from the corresponding "reference" field) in square brackets. NEVER use semicolons. The list of grounds are not exhaustive and you can apply your own. The structure of the response needs to be 3–4 arguments in the format: [GROUND_TITLE + 3–5 bullet points using suggested wording and guidance]. Each bullet point can have multiple sentences in a short paragraph-like structure which consecutively builds upon one another (and remember quotes should be an entire bullet point). Unless in the relevant information, replace unknown information with placeholders, do not invent names, dates, or other information. Do not include a document title, header, introduction, summary, or concluding overall recommendation, just the numbered grounds of argument (title + bullet points).

# KNOWLEDGE
Exclusion Reason: {exclusionReason}

School's Facts: {synthesisedSchoolFacts}

Student Perspective: {synthesisedParentsFacts}

Student Background: {backgroundSummary}

# GUIDANCE DOCUMENTS
Suspensions Guidance: {suspensionsGuidance}

Behaviour in Schools Guidance: {behaviourInSchoolsGuidance}

# POSITION STATEMENT GROUNDS
{positionStatementGrounds}

# YOUR RESPONSE:`,

        formatPositionStatement: `Please reformat the following position statement into **exactly** this JSON style:

{
  "groundsTitles": "Grounds Title 1; Grounds Title 2; Grounds Title 3; Grounds Title 4; ...",
  "groundsReasons": "Ground 1 paragraph 1; Ground 1 paragraph 2; Ground 1 paragraph 3 || Ground 2 paragraph 1; Ground 2 paragraph 2 || Ground 3 paragraph 1; Ground 3 paragraph 2; ..."
}

Formatting rules:
- Each ground title in "groundsTitles" must be separated by a single semicolon ';' (no trailing semicolon at the end).
- Each grounds' reasoning block in "groundsReasons" must be separated by a double pipe '||'.
- Inside each block, each paragraph/reason must be separated by a single semicolon ';' (again, no trailing semicolon at the end).
- Do not add or remove grounds or paragraphs — only reformat as required.
- Preserve the original text of titles and paragraphs exactly, except for trimming leading/trailing whitespace.
- Where appropriate, replace any placeholders in the position statement (including child name, parent name, school name, stage, exclusion date) with the following LaTeX variables (with backslash before the variable and after if there is a space after it): childName, parentName, schoolName, stage, exclusionDate.

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
