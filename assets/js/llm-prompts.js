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
        
        studentPerspectiveAnalysis: `You are a legal expert specialising in UK school exclusion law. Your role is to synthesise information about the student's perspective and whether proper procedures were followed. Focus on identifying potential procedural breaches and the strength of the student's case.`
    },

    // Prompts for different analysis tasks
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
1. Identify and list all stated reasons for the exclusion
2. Quote the exact language used in the letter where possible
3. Categorise the reasons (e.g., behavioural, academic, safety concerns)
4. Note if the exclusion is permanent or fixed-term
5. Identify any specific incidents or dates mentioned

Respond succinctly but without missing any information or detail. Respond ONLY with a 1–3 sentence(s) summary, no other text or formatting. Do NOT include any legal citations or references to statutes or other legal sources.`,

        synthesiseParentsFacts: `Please synthesise the following information about a school exclusion case from the student's perspective:

STUDENT AGREES WITH SCHOOL'S VERSION: {schoolFactsConfirm}

STUDENT'S VERSION OF EVENTS: {parentsFactsInput}

WITNESSES AVAILABLE: {parentsFactsWitnessesInput}

STUDENT VOICE HEARD BEFORE EXCLUSION: {isStudentVoiceHeard}

Please provide a synthesised analysis that:
1. Identifies any contradictions between school and student versions
2. Assesses the strength of the student's position
3. Highlights potential procedural breaches (especially regarding student voice)
4. Notes the availability and potential impact of witnesses
5. Identifies key legal issues that may arise

Respond succinctly but without missing any information or detail. Do NOT include any legal citations or references to statutes or other legal sources. Respond ONLY with the summary as a paragraph, no other text or formatting.`
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
