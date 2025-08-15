# VoxLLM Debug Guide

## Accessing LLM Output Variables

Since the LLM is not yet set up, the system will store blank/null values in the LLM output variables. Here's how to access them for tuning and development.

## Available Variables

### User Responses
```javascript
// Access via browser console
const data = getLLMOutputs();
console.log(data.userResponses);

// Stage 1: About the Exclusion
// - existsExclusionLetter: boolean
// - exclusionLetter: string
// - exclusionSchoolFactsInput: string  
// - exclusionSchoolEvidenceInput: string
// - exclusionSchoolFactsConfirm: boolean
// - exclusionParentsFactsInput: string
// - exclusionParentsFactsWitnessesInput: boolean
// - isStudentVoiceHeard: boolean

// Stage 2: About the Young Person
// - isSend: boolean
// - isSendSchoolAware: boolean
// - sendSchoolAddress: string
// - sendWhoSupport: string
// - isEhcp: boolean
// - isEthnicMin: boolean
// - isPrevSuspend: boolean
// - parentRiskAware: boolean
// - contribFactors: string
```

### LLM Outputs (Currently blank until LLM is set up)
```javascript
// Access via browser console
const data = getLLMOutputs();
console.log(data.llmOutputs);

// Available properties:
// - exclusionReasonLLM: string (currently null)
// - exclusionSchoolFactsLLM: string (currently null)
// - exclusionParentsFactsLLM: string (currently null)

// Background Summary (computed from Stage 2 responses)
// - backgroundSummary: array of strings (computed automatically)

## How to Access

### 1. Open Browser Console
- Press F12 or right-click → Inspect → Console
- Navigate to the VoxLLM page and complete a case

### 2. Get All Data
```javascript
getLLMOutputs()
```

### 3. Get Specific Variables
```javascript
const data = getLLMOutputs();
console.log('Exclusion Letter:', data.userResponses.exclusionLetter);
console.log('LLM Analysis:', data.llmOutputs.exclusionReasonLLM);
```

## Expected Behaviour

### Before LLM Setup
- `exclusionReasonLLM` and `exclusionSchoolFactsLLM` will be `null`
- User responses will contain the actual input data
- Console will show "Analysis completed with some issues"

### After LLM Setup
- `exclusionReasonLLM` will contain the extracted exclusion reason
- `exclusionSchoolFactsLLM` will contain the synthesised school position
- Console will show "Analysis complete!" and log the stored variables

## Tuning the System

### 1. Modify Prompts
Edit the prompts in `assets/js/llm-api.js`:
- `extractExclusionReason()` method
- `synthesiseSchoolFacts()` method

### 2. Adjust System Messages
Modify the system messages to change the AI's role and expertise level.

### 3. Test Different Inputs
Use the chatbot with various test cases to see how the prompts perform.

## Debugging Tips

### Check Console Logs
The system automatically logs:
- All user responses
- LLM outputs (when available)
- Any errors during analysis

### Monitor Network Requests
Check the Network tab in DevTools to see:
- API calls to your LLM endpoint
- Request/response formats
- Any CORS or connection issues

### Test Edge Cases
Try inputs like:
- Very long exclusion letters
- Missing information
- Contradictory statements
- Special characters or formatting

## Common Issues

### LLM Not Responding
- Check your endpoint URL in `config.js`
- Verify server is running and accessible
- Check CORS settings on your server

### Blank Outputs
- LLM may be returning empty responses
- Check your server logs for errors
- Verify the response format matches expected structure

### Slow Responses
- Adjust timeout settings in the code
- Check your LLM processing speed
- Consider adding progress indicators
