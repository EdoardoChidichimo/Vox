// VoxLLM Chatbot Scripts
document.addEventListener('DOMContentLoaded', function() {
    const beginCaseBtn = document.getElementById('beginCaseBtn');
    const chatbotInterface = document.getElementById('chatbotInterface');
    const chatMessages = document.getElementById('chatMessages');
    const chatInputArea = document.getElementById('chatInputArea');
    
    // Initialize LLM API
    const llmAPI = new LLMAPI();
    
    // Store user responses as variables
    let userResponses = {
        // Stage 1: About the Exclusion
        existsExclusionLetter: null,
        exclusionLetter: null,
        exclusionSchoolFactsInput: null,
        exclusionSchoolEvidenceInput: null,
        exclusionSchoolFactsConfirm: null,
        exclusionParentsFactsInput: null,
        exclusionParentsFactsWitnessesInput: null,
        isStudentVoiceHeard: null,
        // Stage 2: About the Young Person
        isSend: null,
        isSendSchoolAware: null,
        sendSchoolAddress: null,
        sendWhoSupport: null,
        isEhcp: null,
        isEthnicMin: null,
        isPrevSuspend: null,
        parentRiskAware: null,
        contribFactors: null,
        // Stage 3: About the Procedure
        stage: null,
        governorProcedureInfo: null
    };
    
    // Store LLM analysis outputs as variables
    let llmOutputs = {
        exclusionReasonLLM: null,
        exclusionSchoolFactsLLM: null,
        exclusionParentsFactsLLM: null
    };
    
    // Store computed background summary
    let backgroundSummary = null;
    
    // Track current question state
    let currentQuestion = null;
    let questionQueue = [];
    
    // Track whether LLM analysis has been completed
    let llmAnalysisCompleted = false;
    
    console.log('DOM loaded, elements found:', {
        beginCaseBtn: beginCaseBtn,
        chatbotInterface: chatbotInterface,
        chatMessages: chatMessages,
        chatInputArea: chatInputArea
    });
    
    // Handle "Begin Your Case" button click
    beginCaseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Button clicked!');
        
        // Show the chatbot interface immediately
        chatbotInterface.style.display = 'block';
        chatbotInterface.style.maxHeight = '800px';
        chatbotInterface.style.opacity = '1';
        chatbotInterface.style.transform = 'translateY(0)';
        chatbotInterface.style.pointerEvents = 'auto';
        chatbotInterface.style.visibility = 'visible';
        chatbotInterface.style.overflow = 'visible';
        chatbotInterface.style.height = 'auto';
        
        // Also add the active class for CSS transitions
        chatbotInterface.classList.add('active');
        console.log('Added active class, chatbot should now be visible');
        
        // Test Ollama connection first
        testOllamaConnection();
        
        // Start the conversation
        startConversation();
    });
    
    // Also add a simple test click handler
    beginCaseBtn.onclick = function() {
        console.log('Button clicked via onclick!');
    };
    
    // Test Ollama connection function
    async function testOllamaConnection() {
        console.log('🧪 Testing Ollama connection...');
        try {
            // First check if the service is accessible
            const isServiceAccessible = await llmAPI.checkServiceStatus();
            if (!isServiceAccessible) {
                console.log('❌ Ollama service is not accessible');
                return;
            }
            
            // Then test the actual API call
            const isConnected = await llmAPI.testConnection();
            if (isConnected) {
                console.log('✅ Ollama connection successful');
            } else {
                console.log('❌ Ollama connection failed');
            }
        } catch (error) {
            console.error('❌ Ollama connection test error:', error);
        }
    }
    
    function startConversation() {
        // Clear any existing messages
        chatMessages.innerHTML = '';
        
        // Reset user responses
        userResponses = {
            // Stage 1: About the Exclusion
            existsExclusionLetter: null,
            exclusionLetter: null,
            exclusionSchoolFactsInput: null,
            exclusionSchoolEvidenceInput: null,
            exclusionSchoolFactsConfirm: null,
            exclusionParentsFactsInput: null,
            exclusionParentsFactsWitnessesInput: null,
            isStudentVoiceHeard: null,
            // Stage 2: About the Young Person
            isSend: null,
            isSendSchoolAware: null,
            sendSchoolAddress: null,
            sendWhoSupport: null,
            isEhcp: null,
            isEthnicMin: null,
            isPrevSuspend: null,
            parentRiskAware: null,
            contribFactors: null,
            // Stage 3: About the Procedure
            stage: null,
            governorProcedureInfo: null
        };
        
        // Reset LLM analysis flag
        llmAnalysisCompleted = false;
        
        // Add greeting message
        addMessage('Hello! I\'m VoxLLM, your AI assistant for school exclusion cases. I\'m here to help you understand your situation and guide you through the process.', 'bot');
        
        // Add first section header
        setTimeout(() => {
            addSectionHeader('— About the Exclusion —', 1);
        }, 1000);
        
        // Wait a moment, then ask the first question
        setTimeout(() => {
            askNextQuestion();
        }, 2000);
    }
    
    async function askNextQuestion() {
        console.log('🔍 askNextQuestion called');
        console.log('Current question queue length:', questionQueue.length);
        console.log('Current question:', currentQuestion);
        console.log('Stage 1 complete:', isStage1Complete());
        console.log('LLM analysis completed:', llmAnalysisCompleted);
        
        if (questionQueue.length === 0) {
            console.log('📝 Question queue is empty, building new queue...');
            // Build question queue based on current responses
            buildQuestionQueue();
            console.log('📝 New question queue length:', questionQueue.length);
        }
        
        if (questionQueue.length === 0) {
            console.log('📝 Question queue still empty after building');
            // Check if this is because the first question was answered with "No"
            if (userResponses.existsExclusionLetter === false) {
                console.log('❌ First question answered with "No", ending conversation');
                // Conversation should end here, no further action needed
                return;
            }
            
            // Check if Stage 1 is complete but LLM analysis is not
            if (isStage1Complete() && !llmAnalysisCompleted) {
                console.log('✅ Stage 1 complete but LLM analysis not complete - calling provideCaseSummary...');
                await provideCaseSummary();
                return;
            }
            
            // Check if Stage 2 is complete but background summary not computed
            if (llmAnalysisCompleted && isStage2Complete() && !backgroundSummary) {
                console.log('✅ Stage 2 complete but background summary not computed - calling provideCaseSummary...');
                console.log('Background summary status:', backgroundSummary);
                console.log('Stage 2 completion status:', isStage2Complete());
                await provideCaseSummary();
                return;
            }
            
            // All questions answered, provide summary
            console.log('✅ All questions answered, calling provideCaseSummary...');
            await provideCaseSummary();
            return;
        }
        
        currentQuestion = questionQueue.shift();
        console.log('📝 Asking question:', currentQuestion);
        askQuestion(currentQuestion);
    }
    
    function buildQuestionQueue() {
        console.log('🔍 buildQuestionQueue called');
        console.log('Current user responses:', userResponses);
        console.log('Current LLM outputs:', llmOutputs);
        console.log('Stage 1 complete:', isStage1Complete());
        console.log('LLM analysis completed:', llmAnalysisCompleted);
        
        questionQueue = [];
        
        // If the first question was answered with "No", don't add any questions
        if (userResponses.existsExclusionLetter === false) {
            console.log('❌ First question answered with "No", no questions added');
            return;
        }
        
        // Stage 1: About the Exclusion
        if (userResponses.existsExclusionLetter === null) {
            questionQueue.push('existsExclusionLetter');
            console.log('➕ Added existsExclusionLetter to queue');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionLetter === null) {
            questionQueue.push('exclusionLetter');
            console.log('➕ Added exclusionLetter to queue');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionSchoolFactsInput === null) {
            questionQueue.push('exclusionSchoolFactsInput');
            console.log('➕ Added exclusionSchoolFactsInput to queue');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionSchoolEvidenceInput === null) {
            questionQueue.push('exclusionSchoolEvidenceInput');
            console.log('➕ Added exclusionSchoolEvidenceInput to queue');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionSchoolFactsConfirm === null) {
            questionQueue.push('exclusionSchoolFactsConfirm');
            console.log('➕ Added exclusionSchoolFactsConfirm to queue');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionParentsFactsInput === null) {
            questionQueue.push('exclusionParentsFactsInput');
            console.log('➕ Added exclusionParentsFactsInput to queue');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionParentsFactsWitnessesInput === null) {
            questionQueue.push('exclusionParentsFactsWitnessesInput');
            console.log('➕ Added exclusionParentsFactsWitnessesInput to queue');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.isStudentVoiceHeard === null) {
            questionQueue.push('isStudentVoiceHeard');
            console.log('➕ Added isStudentVoiceHeard to queue');
        }
        
        // If Stage 1 is complete, we can proceed to Stage 2 questions
        // BUT only after LLM analysis is completed
        if (isStage1Complete() && llmAnalysisCompleted) {
            console.log('✅ Stage 1 complete AND LLM analysis complete, adding Stage 2 questions...');
            
            // Stage 2: About the Young Person
            if (userResponses.isSend === null) {
                questionQueue.push('isSend');
                console.log('➕ Added isSend to queue');
            }
            
            if (userResponses.isSend === true && userResponses.isSendSchoolAware === null) {
                questionQueue.push('isSendSchoolAware');
                console.log('➕ Added isSendSchoolAware to queue');
            }
            
            if (userResponses.isSend === true && userResponses.isSendSchoolAware === true && userResponses.sendSchoolAddress === null) {
                questionQueue.push('sendSchoolAddress');
                console.log('➕ Added sendSchoolAddress to queue');
            }
            
            if (userResponses.isSend === true && userResponses.sendWhoSupport === null) {
                questionQueue.push('sendWhoSupport');
                console.log('➕ Added sendWhoSupport to queue');
            }
            
            if (userResponses.isEhcp === null) {
                questionQueue.push('isEhcp');
                console.log('➕ Added isEhcp to queue');
            }
            
            if (userResponses.isEthnicMin === null) {
                questionQueue.push('isEthnicMin');
                console.log('➕ Added isEthnicMin to queue');
            }
            
            if (userResponses.isPrevSuspend === null) {
                questionQueue.push('isPrevSuspend');
                console.log('➕ Added isPrevSuspend to queue');
            }
            
            if (userResponses.parentRiskAware === null) {
                questionQueue.push('parentRiskAware');
                console.log('➕ Added parentRiskAware to queue');
            }
            
            if (userResponses.contribFactors === null) {
                questionQueue.push('contribFactors');
                console.log('➕ Added contribFactors to queue');
            }
        } else if (isStage1Complete() && !llmAnalysisCompleted) {
            console.log('✅ Stage 1 complete but LLM analysis NOT complete - waiting for analysis...');
            // Don't add any questions - wait for LLM analysis to complete
        }
        
        // Stage 3: About the Procedure (only if Stage 2 is complete AND background summary is computed)
        if (isStage2Complete() && backgroundSummary && userResponses.stage === null) {
            questionQueue.push('stage');
            console.log('➕ Added stage to queue (Stage 2 complete and background summary computed)');
        }
        
        if (isStage2Complete() && backgroundSummary && userResponses.stage === 'IRP' && userResponses.governorProcedureInfo === null) {
            questionQueue.push('governorProcedureInfo');
            console.log('➕ Added governorProcedureInfo to queue (Stage 2 complete and background summary computed)');
        }
        
        // Log why Stage 3 questions might not be added
        if (isStage2Complete() && !backgroundSummary) {
            console.log('⚠️ Stage 2 complete but background summary not computed - Stage 3 questions not added yet');
        }
        
        console.log('📝 Final question queue:', questionQueue);
    }
    
    // Helper function to check if Stage 1 is complete
    function isStage1Complete() {
        return userResponses.existsExclusionLetter === true &&
               userResponses.exclusionLetter !== null &&
               userResponses.exclusionSchoolFactsInput !== null &&
               userResponses.exclusionSchoolEvidenceInput !== null &&
               userResponses.exclusionSchoolFactsConfirm !== null &&
               userResponses.exclusionParentsFactsInput !== null &&
               userResponses.exclusionParentsFactsWitnessesInput !== null &&
               userResponses.isStudentVoiceHeard !== null;
    }
    
    function askQuestion(questionType) {
        switch (questionType) {
            case 'existsExclusionLetter':
                addMessage('Was a letter written to confirm your child\'s exclusion?', 'bot');
                showBooleanOptions();
                break;
            case 'exclusionLetter':
                addMessage('Please provide the content of the exclusion letter. What reasons and details did the school give?', 'bot');
                showTextInput();
                break;
            case 'exclusionSchoolFactsInput':
                addMessage('What does the school say happened to lead to the exclusion? Please describe the school\'s version of events.', 'bot');
                showTextInput();
                break;
            case 'exclusionSchoolEvidenceInput':
                addMessage('What evidence does the school have to support the exclusion?', 'bot');
                showTextInput();
                break;
            case 'exclusionSchoolFactsConfirm':
                addMessage('Does the young person agree that this is what happened?', 'bot');
                showBooleanOptions();
                break;
            case 'exclusionParentsFactsInput':
                addMessage('What is the student\'s version of events?', 'bot');
                showTextInput();
                break;
            case 'exclusionParentsFactsWitnessesInput':
                addMessage('Are there witnesses that can support the young person\'s version of events?', 'bot');
                showBooleanOptions();
                break;
            case 'isStudentVoiceHeard':
                addMessage('Did the school speak with the young person and take their version of events before excluding them?', 'bot');
                showBooleanOptions();
                break;
            // Stage 2: About the Young Person
            case 'isSend':
                // Add Stage 2 header when first Stage 2 question is asked
                addSectionHeader('— About the Young Person —', 2);
                addMessage('Does the young person have SEND?', 'bot');
                showBooleanOptions();
                break;
            case 'isSendSchoolAware':
                addMessage('Is the school aware of this SEND?', 'bot');
                showBooleanOptions();
                break;
            case 'sendSchoolAddress':
                addMessage('If any, what steps have the school taken to address this SEND?', 'bot');
                showTextInput();
                break;
            case 'sendWhoSupport':
                addMessage('Are any clinicians, pastoral workers or professionals working to support the young person with their SEND?', 'bot');
                showSelectOptions(['NA', 'Enter details']);
                break;
            case 'isEhcp':
                addMessage('Does the young person have an EHCP?', 'bot');
                showBooleanOptions();
                break;
            case 'isEthnicMin':
                addMessage('Is the young person from an ethnic minority background?', 'bot');
                showBooleanOptions();
                break;
            case 'isPrevSuspend':
                addMessage('Has the young person been previously suspended?', 'bot');
                showBooleanOptions();
                break;
            case 'parentRiskAware':
                addMessage('Were the family aware of behavioral issues, or the risk of exclusion before it happened?', 'bot');
                showBooleanOptions();
                break;
            case 'contribFactors':
                addMessage('If any, what contributing factors does the student have? (E.g., bereavement, relocation, abuse or neglect, mental health needs, bullying, criminal exploitation, significant challenges at home)', 'bot');
                showTextInput();
                break;
            // Stage 3: About the Procedure
            case 'stage':
                // Add Stage 3 header when first Stage 3 question is asked
                addSectionHeader('— About the Procedure —', 3);
                addMessage('What stage are you at in the process?', 'bot');
                showSelectOptions(['Governors', 'Independent Review Panel']);
                break;
            case 'governorProcedureInfo':
                addMessage('Please provide details about any procedural issues during the governor meeting. Were there any concerns about fairness, time limits, or other procedural matters?', 'bot');
                showTextInput();
                break;
        }
    }
    
    function addMessage(text, sender, stage = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        // Add stage class if provided
        if (stage) {
            messageDiv.classList.add(`stage-${stage}`);
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = text;
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addSectionHeader(title, stage) {
        const headerDiv = document.createElement('div');
        headerDiv.className = `section-header stage-${stage}`;
        headerDiv.textContent = title;
        
        chatMessages.appendChild(headerDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addSectionDivider() {
        const dividerDiv = document.createElement('div');
        dividerDiv.className = 'section-divider';
        chatMessages.appendChild(dividerDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addProgressBar(stepName) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress-bar-container';
        progressDiv.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">Processing ${stepName}...</div>
        `;
        chatMessages.appendChild(progressDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Animate the progress bar
        setTimeout(() => {
            const progressFill = progressDiv.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = '100%';
            }
        }, 100);
        
        // Return the progress div so it can be removed when the step completes
        return progressDiv;
    }
    
    // Function to disable user input during analysis
    function disableUserInput() {
        chatInputArea.style.display = 'none';
        chatInputArea.style.pointerEvents = 'none';
        console.log('🔒 User input disabled during analysis');
    }
    
    // Function to enable user input after analysis
    function enableUserInput() {
        chatInputArea.style.pointerEvents = 'auto';
        console.log('🔓 User input enabled after analysis');
    }
    

    
    function showBooleanOptions() {
        chatInputArea.innerHTML = `
            <div class="boolean-options">
                <button class="boolean-btn yes-btn" onclick="handleBooleanResponse(true)">Yes</button>
                <button class="boolean-btn no-btn" onclick="handleBooleanResponse(false)">No</button>
            </div>
        `;
        chatInputArea.style.display = 'block';
    }
    
    function showTextInput() {
        chatInputArea.innerHTML = `
            <div class="text-input-area">
                <textarea id="textInput" placeholder="Type your response here..." rows="3"></textarea>
                <button class="submit-btn" onclick="handleTextResponse()">Submit</button>
            </div>
        `;
        chatInputArea.style.display = 'block';
    }
    
    function showSelectOptions(options) {
        chatInputArea.innerHTML = `
            <div class="select-options">
                ${options.map(option => 
                    `<button class="select-option-btn" onclick="handleSelectResponse('${option}')">${option}</button>`
                ).join('')}
            </div>
        `;
        chatInputArea.style.display = 'block';
    }
    
    // Make handleBooleanResponse available globally
    window.handleBooleanResponse = function(response) {
        const responseText = response ? 'Yes' : 'No';
        
        // Determine the stage for the user response
        let stage = 1; // Default to stage 1
        if (['isSend', 'isSendSchoolAware', 'sendSchoolAddress', 'sendWhoSupport', 'isEhcp', 'isEthnicMin', 'isPrevSuspend', 'parentRiskAware', 'contribFactors'].includes(currentQuestion)) {
            stage = 2;
        }
        
        addMessage(responseText, 'user', stage);
        
        // Store the response based on current question
        switch (currentQuestion) {
            case 'existsExclusionLetter':
                userResponses.existsExclusionLetter = response;
                
                // Check if we need to stop the process
                if (!response) {
                    addMessage('I\'m sorry, but you must receive an exclusion letter first before we can proceed. The letter must outline the reasons for the exclusion and whether it is permanent or fixed-term. Please contact the school to request this letter and then return to continue.', 'bot');
                    
                    // Hide the input area and stop the conversation
                    chatInputArea.style.display = 'none';
                    
                    // Clear the question queue to prevent further questions
                    questionQueue = [];
                    currentQuestion = null;
                    
                    return;
                }
                break;
            case 'exclusionSchoolFactsConfirm':
                userResponses.exclusionSchoolFactsConfirm = response;
                break;
            case 'exclusionParentsFactsWitnessesInput':
                userResponses.exclusionParentsFactsWitnessesInput = response;
                break;
            case 'isStudentVoiceHeard':
                userResponses.isStudentVoiceHeard = response;
                break;
            // Stage 2: About the Young Person
            case 'isSend':
                userResponses.isSend = response;
                break;
            case 'isSendSchoolAware':
                userResponses.isSendSchoolAware = response;
                break;
            case 'isEhcp':
                userResponses.isEhcp = response;
                break;
            case 'isEthnicMin':
                userResponses.isEthnicMin = response;
                break;
            case 'isPrevSuspend':
                userResponses.isPrevSuspend = response;
                break;
            case 'parentRiskAware':
                userResponses.parentRiskAware = response;
                break;
        }
        
        // Hide the input area
        chatInputArea.style.display = 'none';
        
        // Continue with next question
        setTimeout(() => {
            askNextQuestion();
        }, 1000);
    };
    
    // Make handleSelectResponse available globally
    window.handleSelectResponse = function(response) {
        // Determine the stage for the user response
        let stage = 1; // Default to stage 1
        if (['isSend', 'isSendSchoolAware', 'sendSchoolAddress', 'sendWhoSupport', 'isEhcp', 'isEthnicMin', 'isPrevSuspend', 'parentRiskAware', 'contribFactors'].includes(currentQuestion)) {
            stage = 2;
        } else if (['stage', 'governorProcedureInfo'].includes(currentQuestion)) {
            stage = 3;
        }
        
        addMessage(response, 'user', stage);
        
        // Store the response
        if (currentQuestion === 'sendWhoSupport') {
            if (response === 'Enter details') {
                // Show text input for details
                showTextInput();
                return;
            } else {
                userResponses.sendWhoSupport = response;
            }
        } else if (currentQuestion === 'stage') {
            userResponses.stage = response;
        }
        
        // Hide the input area
        chatInputArea.style.display = 'none';
        
        // Continue with next question
        setTimeout(() => {
            askNextQuestion();
        }, 1000);
    };
    

    
    // Make handleTextResponse available globally
    window.handleTextResponse = function() {
        const textInput = document.getElementById('textInput');
        const response = textInput.value.trim();
        
        if (!response) {
            addMessage('Please provide a response before submitting.', 'bot');
            return;
        }
        
        // Determine the stage for the user response
        let stage = 1; // Default to stage 1
        if (['isSend', 'isSendSchoolAware', 'sendSchoolAddress', 'sendWhoSupport', 'isEhcp', 'isEthnicMin', 'isPrevSuspend', 'parentRiskAware', 'contribFactors'].includes(currentQuestion)) {
            stage = 2;
        } else if (['stage', 'governorProcedureInfo'].includes(currentQuestion)) {
            stage = 3;
        }
        
        addMessage(response, 'user', stage);
        
        // Store the response based on current question
        switch (currentQuestion) {
            case 'exclusionLetter':
                userResponses.exclusionLetter = response;
                break;
            case 'exclusionSchoolFactsInput':
                userResponses.exclusionSchoolFactsInput = response;
                break;
            case 'exclusionSchoolEvidenceInput':
                userResponses.exclusionSchoolEvidenceInput = response;
                break;
            case 'exclusionParentsFactsInput':
                userResponses.exclusionParentsFactsInput = response;
                break;
            case 'sendSchoolAddress':
                userResponses.sendSchoolAddress = response;
                break;
            case 'contribFactors':
                userResponses.contribFactors = response;
                break;
            case 'governorProcedureInfo':
                userResponses.governorProcedureInfo = response;
                break;
        }
        
        // Hide the input area
        chatInputArea.style.display = 'none';
        
        // Continue with next question
        setTimeout(() => {
            askNextQuestion();
        }, 1000);
    };
    
    async function provideCaseSummary() {
        console.log('🔍 provideCaseSummary called');
        console.log('Current state:', {
            isStage1Complete: isStage1Complete(),
            isStage2Complete: isStage2Complete(),
            isStage3Complete: isStage3Complete(),
            llmAnalysisCompleted: llmAnalysisCompleted,
            llmOutputs: llmOutputs,
            userResponses: userResponses
        });
        
        // Check which stage we're completing
        if (isStage1Complete() && !llmAnalysisCompleted) {
            console.log('✅ Stage 1 complete, starting LLM analysis...');

            // Disable user input during analysis
            disableUserInput();
            
            // Show progress tracker and update to Stage 2
            const progressTracker = document.getElementById('progressTracker');
            if (progressTracker) {
                progressTracker.style.display = 'block';
                updateProgressTracker(2);
            }
            
            // Perform Stage 1 LLM analysis synchronously with progress updates
            if (userResponses.existsExclusionLetter) {
                try {
                    console.log('🔄 Starting Stage 1 LLM analysis sequence...');
                    
                    // Small delay to let user read the initial message
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    console.log('🔄 Calling runStage1LLMAnalysisWithProgress...');
                    await runStage1LLMAnalysisWithProgress();
                    console.log('✅ runStage1LLMAnalysisWithProgress completed');
                    
                    // Enable user input after analysis
                    enableUserInput();
                   
                    // Add section divider after analysis
                    setTimeout(() => {
                        addSectionDivider();
                    }, 2000);
                    
                    // Start Stage 2 questions after analysis with a longer delay
                    setTimeout(() => {
                        askNextQuestion();
                    }, 3000);
                    
                } catch (error) {
                    console.error('❌ Stage 1 analysis failed:', error);
                    addMessage('There was an error during the analysis. Please try again or contact support.', 'bot');
                    // Re-enable user input on error
                    enableUserInput();
                    return; // Don't continue if analysis failed
                }
            }
        } else if (llmAnalysisCompleted && !isStage2Complete()) {
            console.log('✅ LLM analysis complete, continuing with Stage 2 questions...');
            addMessage('Now that the analysis is complete, let\'s continue with Stage 2 questions...', 'bot');
            
            // Add section divider
            setTimeout(() => {
                addSectionDivider();
            }, 1500);
            
            // Continue with Stage 2 questions
            setTimeout(() => {
                askNextQuestion();
            }, 2000);
            
        } else if (llmAnalysisCompleted && isStage2Complete() && !backgroundSummary) {
            console.log('✅ Stage 2 complete, computing background summary...');
            console.log('Background summary status:', backgroundSummary);
            console.log('Stage 2 completion status:', isStage2Complete());
            
            // Disable user input during background summary computation
            disableUserInput();
            
            // Update progress tracker to Stage 3
            updateProgressTracker(3);
            
            try {
                // Show progress bar for background summary computation
                const progressBar = addProgressBar('backgroundSummary');
                
                // Small delay to let user read the message
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Simulate computation time for better UX
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Compute background summary
                const summary = computeBackgroundSummary();
                console.log('✅ Background summary computed:', summary);
                
                // Remove the progress bar
                if (progressBar && progressBar.parentNode) {
                    progressBar.remove();
                }
                
                // Display the background summary
                addMessage('**Background Summary:**\n\n' + summary.join('\n'), 'bot');
                
                // Enable user input after background summary
                enableUserInput();
                
                // Add section divider after background summary
                setTimeout(() => {
                    addSectionDivider();
                }, 2000);
                
                // Continue to Stage 3 automatically
                setTimeout(() => {
                    askNextQuestion();
                }, 3000);
                
            } catch (error) {
                console.error('❌ Background summary computation failed:', error);
                addMessage('There was an error collating the background summary. Please try again or contact support.', 'bot');
                // Re-enable user input on error
                enableUserInput();
                return; // Don't continue if computation failed
            }
            
        } else if (llmAnalysisCompleted && isStage3Complete()) {
            console.log('✅ Stage 3 complete, final analysis...');
            addMessage('Thank you for providing all the information for Stage 3. Your case has been fully processed and analysed.', 'bot');
            
            // Update progress tracker to Stage 4
            updateProgressTracker(4);
            
            // Log the stored variables for debugging/tuning
            console.log('Stage 3 completed. Background Summary:', backgroundSummary);
            console.log('All User Responses:', userResponses);
        } else {
            console.log('❌ No stage complete, cannot proceed');
            addMessage('To proceed with case analysis, you\'ll need to provide an exclusion letter from the school.', 'bot');
        }
    }
    
    // Function to run Stage 1 LLM analysis synchronously with progress updates
    async function runStage1LLMAnalysisWithProgress() {
        console.log('🔄 Starting Stage 1 LLM analysis...');
    
        
        try {
            // Step 1: Extract exclusion reason
            const progressBar1 = addProgressBar('extractExclusionReason');
            
            const exclusionReason = await llmAPI.extractExclusionReason(userResponses.exclusionLetter);
            console.log('Exclusion reason extracted:', exclusionReason);
            llmOutputs.exclusionReasonLLM = exclusionReason;
            
            // Remove the progress bar
            if (progressBar1 && progressBar1.parentNode) {
                progressBar1.remove();
            }
            
            // Show the result
            addMessage('**Exclusion Reason Analysis:**\n\n' + exclusionReason, 'bot');
            
            // Pause to let user read the result
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 2: Synthesise school facts
            const progressBar2 = addProgressBar('synthesiseSchoolFacts');
            
            const synthesisedFacts = await llmAPI.synthesiseSchoolFacts(
                userResponses.exclusionLetter,
                userResponses.exclusionSchoolFactsInput,
                userResponses.exclusionSchoolEvidenceInput
            );
            console.log('School facts synthesised:', synthesisedFacts);
            llmOutputs.exclusionSchoolFactsLLM = synthesisedFacts;
            
            // Remove the progress bar
            if (progressBar2 && progressBar2.parentNode) {
                progressBar2.remove();
            }
            
            // Show the result
            addMessage('**School Facts Analysis:**\n\n' + synthesisedFacts, 'bot');
            
            // Pause to let user read the result
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 3: Synthesise parents facts
            const progressBar3 = addProgressBar('synthesiseParentsFacts');
            
            const parentsFactsSynthesis = await llmAPI.synthesiseParentsFacts(
                userResponses.exclusionSchoolFactsConfirm,
                userResponses.exclusionParentsFactsInput,
                userResponses.exclusionParentsFactsWitnessesInput,
                userResponses.isStudentVoiceHeard
            );
            console.log('Parents facts synthesised:', parentsFactsSynthesis);
            llmOutputs.exclusionParentsFactsLLM = parentsFactsSynthesis;
            
            // Remove the progress bar
            if (progressBar3 && progressBar3.parentNode) {
                progressBar3.remove();
            }
            
            // Show the result
            addMessage('**Student Perspective Analysis:**\n\n' + parentsFactsSynthesis, 'bot');
            
            // Pause to let user read the final result
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('✅ Stage 1 LLM analysis complete');
            console.log('Stage 1 LLM Outputs stored:', llmOutputs);
            
            // Mark LLM analysis as completed
            llmAnalysisCompleted = true;
            console.log('✅ LLM analysis marked as completed');
            
        } catch (error) {
            console.error('❌ Stage 1 LLM analysis failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                llmAPI: llmAPI,
                userResponses: userResponses
            });
            
            addMessage('**Analysis Error:** ' + error.message + '\n\nPlease check the console for more details.', 'bot');
            throw error; // Re-throw to handle in calling function
        }
    }
    
    // Helper function to check if Stage 2 is complete
    function isStage2Complete() {
        // Stage 2 can be complete once all questions are answered
        // LLM analysis is now completed before Stage 2 begins
        return userResponses.isSend !== null &&
               userResponses.isEhcp !== null &&
               userResponses.isEthnicMin !== null &&
               userResponses.isPrevSuspend !== null &&
               userResponses.parentRiskAware !== null &&
               userResponses.contribFactors !== null &&
               // Handle conditional SEND questions
               (userResponses.isSend === false || 
                (userResponses.isSend === true && 
                 userResponses.isSendSchoolAware !== null &&
                 (userResponses.isSendSchoolAware === false || 
                  (userResponses.isSendSchoolAware === true && userResponses.sendSchoolAddress !== null)) &&
                 userResponses.sendWhoSupport !== null));
    }
    
    // Helper function to check if Stage 3 is complete
    function isStage3Complete() {
        if (userResponses.stage === 'IRP') {
            return userResponses.governorProcedureInfo !== null;
        }
        return userResponses.stage !== null; // For 'Governors' stage, only need the stage selection
    }
    
    // Function to update progress tracker
    function updateProgressTracker(stage) {
        const stages = document.querySelectorAll('.stage');
        stages.forEach((stageElement, index) => {
            if (index + 1 <= stage) {
                stageElement.classList.add('active');
            } else {
                stageElement.classList.remove('active');
            }
        });
    }
    
    // Function to compute background summary based on conditional variables
    function computeBackgroundSummary() {
        const summary = [];
        
        if (userResponses.isSend) {
            summary.push("Young person has SEND");
            if (userResponses.isSendSchoolAware) {
                summary.push("School is aware of SEND");
                if (userResponses.sendSchoolAddress) {
                    summary.push(`School has taken steps: ${userResponses.sendSchoolAddress}`);
                }
            } else {
                summary.push("School is NOT aware of SEND");
            }
            if (userResponses.sendWhoSupport && userResponses.sendWhoSupport !== 'NA') {
                summary.push(`Professional support: ${userResponses.sendWhoSupport}`);
            } else if (userResponses.sendWhoSupport === 'NA') {
                summary.push("No professional support for SEND");
            }
        } else {
            summary.push("Young person does NOT have SEND");
        }
        
        if (userResponses.isEhcp) {
            summary.push("Young person has EHCP");
        } else {
            summary.push("Young person does NOT have EHCP");
        }
        
        if (userResponses.isEthnicMin) {
            summary.push("Young person is from ethnic minority background");
        } else {
            summary.push("Young person is NOT from ethnic minority background");
        }
        
        if (userResponses.isPrevSuspend) {
            summary.push("Young person has been previously suspended");
        } else {
            summary.push("Young person has NOT been previously suspended");
        }
        
        if (userResponses.parentRiskAware) {
            summary.push("Family was aware of behavioral issues/risk of exclusion");
        } else {
            summary.push("Family was NOT aware of behavioral issues/risk of exclusion");
        }
        
        if (userResponses.contribFactors) {
            summary.push(`Contributing factors: ${userResponses.contribFactors}`);
        } else {
            summary.push("No specific contributing factors identified");
        }
        
        backgroundSummary = summary;
        return summary;
    }
    
    // Function to get current LLM outputs for tuning/debugging
    window.getLLMOutputs = function() {
        return {
            userResponses: userResponses,
            llmOutputs: llmOutputs,
            backgroundSummary: backgroundSummary
        };
    };
    
    // Function to manually trigger LLM analysis for debugging
    window.triggerLLMAnalysis = async function() {
        console.log('🔧 Manually triggering LLM analysis...');
        console.log('Current user responses:', userResponses);
        
        if (!userResponses.existsExclusionLetter) {
            console.log('❌ No exclusion letter available for analysis');
            addMessage('No exclusion letter available for analysis. Please complete the form first.', 'bot');
            return;
        }
        
        try {
            addMessage('Manually triggering Stage 1 analysis...', 'bot');
            
            // Use the same synchronous analysis function
            await runStage1LLMAnalysisWithProgress();
            
            addMessage('Manual Stage 1 analysis complete!', 'bot');
            console.log('Manual analysis completed. LLM Outputs:', llmOutputs);
            
        } catch (error) {
            console.error('❌ Manual LLM analysis failed:', error);
            addMessage('Manual analysis failed. Please check the console for details.', 'bot');
        }
    };
    
    // Function to check LLM analysis status
    window.checkLLMStatus = function() {
        const status = {
            exclusionReasonLLM: !!llmOutputs.exclusionReasonLLM,
            exclusionSchoolFactsLLM: !!llmOutputs.exclusionSchoolFactsLLM,
            exclusionParentsFactsLLM: !!llmOutputs.exclusionParentsFactsLLM
        };
        
        const completedCount = Object.values(status).filter(Boolean).length;
        const totalCount = Object.keys(status).length;
        
        console.log('📊 LLM Analysis Status:', status);
        console.log(`Progress: ${completedCount}/${totalCount} analyses complete`);
        
        // if (completedCount === totalCount) {
        //     addMessage('All Stage 1 LLM analysis complete!', 'bot');
        // } else if (completedCount > 0) {
        //     addMessage(`Stage 1 LLM analysis in progress: ${completedCount}/${totalCount} complete`, 'bot');
        // } else {
        //     addMessage('Stage 1 LLM analysis not yet started', 'bot');
        // }
        
        return status;
    };
    
    // Function to close the chatbot
    window.closeChatbot = function() {
        // Hide the chatbot interface
        chatbotInterface.classList.remove('active');
        chatbotInterface.style.display = 'none';
        chatbotInterface.style.maxHeight = '0';
        chatbotInterface.style.opacity = '0';
        chatbotInterface.style.transform = 'translateY(-20px)';
        chatbotInterface.style.pointerEvents = 'none';
        chatbotInterface.style.visibility = 'hidden';
        chatbotInterface.style.overflow = 'hidden';
        chatbotInterface.style.height = '0';
        
        // Clear chat messages
        chatMessages.innerHTML = '';
        
        // Hide input area
        chatInputArea.style.display = 'none';
        
        // Reset state
        currentQuestion = null;
        questionQueue = [];
        userResponses = {
            // Stage 1: About the Exclusion
            existsExclusionLetter: null,
            exclusionLetter: null,
            exclusionSchoolFactsInput: null,
            exclusionSchoolEvidenceInput: null,
            exclusionSchoolFactsConfirm: null,
            exclusionParentsFactsInput: null,
            exclusionParentsFactsWitnessesInput: null,
            isStudentVoiceHeard: null,
            // Stage 2: About the Young Person
            isSend: null,
            isSendSchoolAware: null,
            sendSchoolAddress: null,
            sendWhoSupport: null,
            isEhcp: null,
            isEthnicMin: null,
            isPrevSuspend: null,
            parentRiskAware: null,
            contribFactors: null,
            // Stage 3: About the Procedure
            stage: null,
            governorProcedureInfo: null
        };
        llmOutputs = {
            exclusionReasonLLM: null,
            exclusionSchoolFactsLLM: null,
            exclusionParentsFactsLLM: null
        };
        backgroundSummary = null;
        llmAnalysisCompleted = false;
    };
});
