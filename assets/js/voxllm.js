document.addEventListener('DOMContentLoaded', function() {
    const beginCaseBtn = document.getElementById('beginCaseBtn');
    const chatbotInterface = document.getElementById('chatbotInterface');
    const chatMessages = document.getElementById('chatMessages');
    const chatInputArea = document.getElementById('chatInputArea');
    
    const llmAPI = new LLMAPI();
    
    // Make llmAPI globally accessible for console debugging
    window.llmAPI = llmAPI;
    
    // Helper function to set API key from console
    window.setApiKey = function(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            console.error('❌ Please provide a valid API key string');
            console.log('💡 Usage: setApiKey("your_api_key_here")');
            return false;
        }
        
        llmAPI.setApiKey(apiKey);
        console.log('✅ API key set successfully');
        console.log('🔧 You can now test the connection with: testLLMConnection()');
        return true;
    };
    
    // Helper function to test LLM connection from console
    window.testLLMConnection = async function() {
        console.log('🧪 Testing LLM connection...');
        try {
            const success = await llmAPI.testConnection();
            if (success) {
                console.log('✅ LLM connection test successful!');
            } else {
                console.log('❌ LLM connection test failed');
            }
            return success;
        } catch (error) {
            console.error('❌ LLM connection test error:', error);
            return false;
        }
    };
    
    // Helper function to check current API key status
    window.checkApiKeyStatus = function() {
        const currentKey = llmAPI.apiKey;
        if (currentKey && currentKey.length > 0) {
            console.log('✅ API key is set (length:', currentKey.length, 'characters)');
            console.log('🔑 Key preview:', currentKey.substring(0, 10) + '...' + currentKey.substring(currentKey.length - 4));
        } else {
            console.log('❌ No API key set');
            console.log('💡 Set it with: setApiKey("your_api_key_here")');
        }
        return !!currentKey;
    };
    
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
        governorProcedureInfo: null,
        // Stage 4: Document Details
        childName: null,
        parentName: null,
        schoolName: null,
        exclusionDate: null
    };
    let llmOutputs = {
        exclusionReasonLLM: null,
        exclusionSchoolFactsLLM: null,
        exclusionParentsFactsLLM: null,
        positionStatementRaw: null,
        positionStatementFormatted: null
    };
    let backgroundSummary = null;
    let totalContext = null;
    
    let currentQuestion = null;
    let questionQueue = [];    
    let llmAnalysisCompleted = false;
    
    
    // Handle "Begin Your Case" button click
    beginCaseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
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
        
        // Test Ollama connection first
        testOllamaConnection();
        
        // Start the conversation
        startConversation();
    });
    
    // Test Ollama connection function
    async function testOllamaConnection() {
        console.log('Testing Ollama connection...');
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
            governorProcedureInfo: null,
            // Stage 4: Document Details
            childName: null,
            parentName: null,
            schoolName: null,
            exclusionDate: null
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
                // Conversation should end here, no further action needed
                return;
            }
            
            // Check if Stage 1 is complete but LLM analysis is not
            if (isStage1Complete() && !llmAnalysisCompleted) {
                await provideCaseSummary();
                return;
            }
            
            // Check if Stage 2 is complete but background summary not computed
            if (llmAnalysisCompleted && isStage2Complete() && !backgroundSummary) {
                await provideCaseSummary();
                return;
            }
            
            // All questions answered, provide summary
            await provideCaseSummary();
            return;
        }
        
        currentQuestion = questionQueue.shift();
        console.log('📝 Asking question:', currentQuestion);
        askQuestion(currentQuestion);
    }
    
    function buildQuestionQueue() {
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
            }
            
            if (userResponses.isSend === true && userResponses.isSendSchoolAware === null) {
                questionQueue.push('isSendSchoolAware');
            }
            
            if (userResponses.isSend === true && userResponses.isSendSchoolAware === true && userResponses.sendSchoolAddress === null) {
                questionQueue.push('sendSchoolAddress');
            }
            
            if (userResponses.isSend === true && userResponses.sendWhoSupport === null) {
                questionQueue.push('sendWhoSupport');
            }
            
            if (userResponses.isEhcp === null) {
                questionQueue.push('isEhcp');
            }
            
            if (userResponses.isEthnicMin === null) {
                questionQueue.push('isEthnicMin');
            }
            
            if (userResponses.isPrevSuspend === null) {
                questionQueue.push('isPrevSuspend');
            }
            
            if (userResponses.parentRiskAware === null) {
                questionQueue.push('parentRiskAware');
            }
            
            if (userResponses.contribFactors === null) {
                questionQueue.push('contribFactors');
            }
        }
        
        // Stage 3: About the Procedure (only if Stage 2 is complete AND background summary is computed)
        if (isStage2Complete() && backgroundSummary && userResponses.stage === null) {
            questionQueue.push('stage');
        }
        
        if (isStage2Complete() && backgroundSummary && userResponses.stage === 'IRP' && userResponses.governorProcedureInfo === null) {
            questionQueue.push('governorProcedureInfo');
        }
        
        // Stage 4: Document Details (only after position statement is generated)
        if (isStage3Complete() && llmOutputs.positionStatementRaw && !llmOutputs.positionStatementFormatted) {
            // This will be handled in the final processing, not through question queue
        } else if (llmOutputs.positionStatementFormatted) {
            // Add document detail questions if position statement is formatted but details not collected
            if (userResponses.childName === null) {
                questionQueue.push('childName');
            }
            
            if (userResponses.parentName === null) {
                questionQueue.push('parentName');
            }
            
            if (userResponses.schoolName === null) {
                questionQueue.push('schoolName');
            }
            
            if (userResponses.exclusionDate === null) {
                questionQueue.push('exclusionDate');
            }
        }
        
    }
    
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
            // Stage 4: Document Details
            case 'childName':
                // Add Stage 4 header when first Stage 4 question is asked
                addSectionHeader('— Document Details —', 4);
                addMessage('What is the child\'s full name?', 'bot');
                showTextInput();
                break;
            case 'parentName':
                addMessage('What is the parent\'s full name?', 'bot');
                showTextInput();
                break;
            case 'schoolName':
                addMessage('What is the full name of the school?', 'bot');
                showTextInput();
                break;
            case 'exclusionDate':
                addMessage('What is the full date of the exclusion? (Please provide in DD/MM/YYYY format)', 'bot');
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
    }
    
    // Function to enable user input after analysis
    function enableUserInput() {
        chatInputArea.style.pointerEvents = 'auto';
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
        } else if (['stage', 'governorProcedureInfo'].includes(currentQuestion)) {
            stage = 3;
        } else if (['childName', 'parentName', 'schoolName', 'exclusionDate'].includes(currentQuestion)) {
            stage = 4;
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
        } else if (['childName', 'parentName', 'schoolName', 'exclusionDate'].includes(currentQuestion)) {
            stage = 4;
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
        } else if (['childName', 'parentName', 'schoolName', 'exclusionDate'].includes(currentQuestion)) {
            stage = 4;
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
            case 'childName':
                userResponses.childName = response;
                break;
            case 'parentName':
                userResponses.parentName = response;
                break;
            case 'schoolName':
                userResponses.schoolName = response;
                break;
            case 'exclusionDate':
                userResponses.exclusionDate = response;
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

            disableUserInput();
            
            const progressTracker = document.getElementById('progressTracker');
            if (progressTracker) {
                progressTracker.style.display = 'block';
                updateProgressTracker(2);
            }
            
            // Perform Stage 1 LLM analysis synchronously with progress updates
            if (userResponses.existsExclusionLetter) {
                try {
                    
                    // Small delay to let user read the initial message
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    await runStage1LLMAnalysisWithProgress();
                    
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
                    enableUserInput();
                    return; // Don't continue if analysis failed
                }
            }
        } else if (llmAnalysisCompleted && !isStage2Complete()) {
            // Add section divider
            setTimeout(() => {
                addSectionDivider();
            }, 1500);
            
            // Continue with Stage 2 questions
            setTimeout(() => {
                askNextQuestion();
            }, 2000);
            
        } else if (llmAnalysisCompleted && isStage2Complete() && !backgroundSummary) {
            
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
                
                const summary = computeBackgroundSummary();
                
                if (progressBar && progressBar.parentNode) {
                    progressBar.remove();
                }
                
                addMessage('**Background Summary:**\n\n' + summary.join('\n'), 'bot');
    
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
                enableUserInput();
                return; // Don't continue if computation failed
            }
            
        } else if (llmAnalysisCompleted && isStage3Complete() && !llmOutputs.positionStatementRaw) {
            await generateFinalPositionStatement();
        } else if (llmOutputs.positionStatementFormatted && isStage4Complete()) {
            await generateFinalPDF();
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
            const progressBar1 = addProgressBar('Extracting Reason for Exclusion');
            const exclusionReason = await llmAPI.extractExclusionReason(userResponses.exclusionLetter);
            llmOutputs.exclusionReasonLLM = exclusionReason;
            if (progressBar1 && progressBar1.parentNode) {
                progressBar1.remove();
            }
            addMessage('**Exclusion Reason Analysis:**\n\n' + exclusionReason, 'bot');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 2: Synthesise school facts
            const progressBar2 = addProgressBar('Synthesising School Facts');
            const synthesisedSchoolFacts = await llmAPI.synthesiseSchoolFacts(
                userResponses.exclusionLetter,
                userResponses.exclusionSchoolFactsInput,
                userResponses.exclusionSchoolEvidenceInput
            );
            llmOutputs.exclusionSchoolFactsLLM = synthesisedSchoolFacts;
            if (progressBar2 && progressBar2.parentNode) {
                progressBar2.remove();
            }
            addMessage('**School Facts Analysis:**\n\n' + synthesisedSchoolFacts, 'bot');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 3: Synthesise parents facts
            const progressBar3 = addProgressBar('Synthesising Parents Facts');
            const synthesisedParentsFacts = await llmAPI.synthesiseParentsFacts(
                userResponses.exclusionSchoolFactsConfirm,
                userResponses.exclusionParentsFactsInput,
                userResponses.exclusionParentsFactsWitnessesInput,
                userResponses.isStudentVoiceHeard
            );
            llmOutputs.exclusionParentsFactsLLM = synthesisedParentsFacts;
            if (progressBar3 && progressBar3.parentNode) {
                progressBar3.remove();
            }
            addMessage('**Student Perspective Analysis:**\n\n' + synthesisedParentsFacts, 'bot');
            await new Promise(resolve => setTimeout(resolve, 2000));
            

            llmAnalysisCompleted = true;
            
        } catch (error) {
            console.error('❌ Stage 1 LLM analysis failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                llmAPI: llmAPI,
                userResponses: userResponses
            });
            
            throw error;
        }
    }
    

    function isStage2Complete() {
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
    
    function isStage3Complete() {
        if (userResponses.stage === 'IRP') {
            return userResponses.governorProcedureInfo !== null;
        }
        return userResponses.stage !== null; // For 'Governors' stage, only need the stage selection
    }
    
    function isStage4Complete() {
        return userResponses.childName !== null &&
               userResponses.parentName !== null &&
               userResponses.schoolName !== null &&
               userResponses.exclusionDate !== null;
    }
    

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
    
    function createTotalContext() {
        const sections = [];
        sections.push("EXCLUSION REASON ANALYSIS:\n" + llmOutputs.exclusionReasonLLM);
        sections.push("SCHOOL FACTS ANALYSIS:\n" + llmOutputs.exclusionSchoolFactsLLM);
        sections.push("STUDENT PERSPECTIVE ANALYSIS:\n" + llmOutputs.exclusionParentsFactsLLM);
        sections.push("CHILD BACKGROUND SUMMARY:\n" + backgroundSummary.join('\n'));
        
        totalContext = sections.join('\n\n');
        return totalContext;
    }
    
    async function generateFinalPositionStatement() {
        console.log('🔄 Starting final position statement generation...');
        
        // Disable user input during final processing
        disableUserInput();
        
        // Update progress tracker to Stage 4
        updateProgressTracker(4);
        
        addMessage('Thank you. Your case is now being processed. I will check all relevant documents and provide you with a detailed position statement.', 'bot');
        
        try {
            // Show progress bar for position statement generation
            const progressBar = addProgressBar('Generating Position Statement');
            
            // Small delay to let user read the message
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Load the required documents
            const suspensionsGuidance = await loadTextFile('/documents/statutory_guidance/suspensions.txt');
            const behaviourInSchoolsGuidance = await loadTextFile('/documents/statutory_guidance/behaviour_in_schools.txt');
            
            let positionStatementGrounds;
            if (userResponses.stage === 'Governors') {
                positionStatementGrounds = await loadTextFile('/documents/governors_panel_arguments.json');
            } else {
                positionStatementGrounds = await loadTextFile('/documents/irp_arguments.json');
            }
            
            // Generate the position statement
            const positionStatement = await llmAPI.generatePositionStatement(
                llmOutputs.exclusionReasonLLM,
                llmOutputs.exclusionSchoolFactsLLM,
                llmOutputs.exclusionParentsFactsLLM,
                backgroundSummary.join('\n'),
                suspensionsGuidance,
                behaviourInSchoolsGuidance,
                positionStatementGrounds
            );
            
            if (progressBar && progressBar.parentNode) {
                progressBar.remove();
            }
            
            // Store the raw position statement
            llmOutputs.positionStatementRaw = positionStatement;
            
            // Display the position statement
            addMessage('**Position Statement:**\n\n' + positionStatement, 'bot');
            
            // Now format the position statement
            await formatAndContinueToDocumentDetails(positionStatement);
            
            console.log('✅ Position statement generated successfully');
            
        } catch (error) {
            console.error('❌ Position statement generation failed:', error);
            addMessage('There was an error generating the position statement. Please try again or contact support.', 'bot');
        }
    }
    
    async function formatAndContinueToDocumentDetails(positionStatement) {
        try {
            // Show progress bar for formatting
            const progressBar = addProgressBar('Formatting Position Statement');
            
            // Format the position statement
            const formattedPositionStatement = await llmAPI.formatPositionStatement(positionStatement);
            llmOutputs.positionStatementFormatted = formattedPositionStatement;
            
            if (progressBar && progressBar.parentNode) {
                progressBar.remove();
            }
            
            addMessage('Position statement has been formatted for document generation.', 'bot');
            
            // Enable user input for document details collection
            enableUserInput();
            
            // Add section divider
            setTimeout(() => {
                addSectionDivider();
            }, 1500);
            
            // Continue to document details questions
            setTimeout(() => {
                askNextQuestion();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Position statement formatting failed:', error);
            addMessage('There was an error formatting the position statement. Please try again or contact support.', 'bot');
            enableUserInput();
        }
    }
    
    async function generateFinalPDF() {
        console.log('🔄 Starting final PDF generation...');
        
        // Disable user input during final processing
        disableUserInput();
        
        addMessage('Thank you for providing all the necessary information. I am now generating your final position statement document as a PDF.', 'bot');
        
        try {
            // Show progress bar for PDF generation
            const progressBar = addProgressBar('Generating PDF Document');
            
            // Parse the formatted position statement
            const formattedData = JSON.parse(llmOutputs.positionStatementFormatted);
            
            // Prepare data for LaTeX template
            const latexData = {
                childName: userResponses.childName,
                parentName: userResponses.parentName,
                schoolName: userResponses.schoolName,
                stage: userResponses.stage === 'IRP' ? 'Independent Review Panel' : 'Governors',
                exclusionDate: userResponses.exclusionDate,
                groundsTitles: formattedData.groundsTitles,
                groundReasons: formattedData.groundsReasons
            };
            
            // Generate PDF using the LaTeX template
            const pdfBlob = await generatePDFFromLatex(latexData);
            
            if (progressBar && progressBar.parentNode) {
                progressBar.remove();
            }
            
            // Provide download link
            const downloadUrl = URL.createObjectURL(pdfBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = `Position_Statement_${userResponses.childName.replace(/\s+/g, '_')}.pdf`;
            
            addMessage('✅ Your position statement PDF has been generated successfully!', 'bot');
            
            // Create download button in chat
            const downloadButton = document.createElement('button');
            downloadButton.className = 'download-btn';
            downloadButton.textContent = '📄 Download Position Statement PDF';
            downloadButton.onclick = () => {
                downloadLink.click();
            };
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'download-container';
            buttonContainer.appendChild(downloadButton);
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message bot-message';
            messageDiv.appendChild(buttonContainer);
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Create total context for final summary
            createTotalContext();
            
            console.log('✅ PDF generated successfully');
            
        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            addMessage('There was an error generating the PDF. Please try again or contact support.', 'bot');
            enableUserInput();
        }
    }
    
    async function generatePDFFromLatex(data) {
        try {
            // This function will handle the LaTeX compilation and PDF generation
            // For now, we'll create a simple implementation that sends the data to a backend service
            
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`PDF generation failed: ${response.statusText}`);
            }
            
            return await response.blob();
            
        } catch (error) {
            console.error('Error generating PDF from LaTeX:', error);
            throw error;
        }
    }
    
    async function loadTextFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error);
            throw error;
        }
    }
    
    window.getLLMOutputs = function() {
        return {
            userResponses: userResponses,
            llmOutputs: llmOutputs,
            backgroundSummary: backgroundSummary,
            totalContext: totalContext
        };
    };
    

    window.checkLLMStatus = function() {
        const status = {
            exclusionReasonLLM: !!llmOutputs.exclusionReasonLLM,
            exclusionSchoolFactsLLM: !!llmOutputs.exclusionSchoolFactsLLM,
            exclusionParentsFactsLLM: !!llmOutputs.exclusionParentsFactsLLM
        };
        
        const completedCount = Object.values(status).filter(Boolean).length;
        const totalCount = Object.keys(status).length;
        
        console.log('LLM Analysis Status:', status);
        console.log(`Progress: ${completedCount}/${totalCount} analyses complete`);
        
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
            governorProcedureInfo: null,
            // Stage 4: Document Details
            childName: null,
            parentName: null,
            schoolName: null,
            exclusionDate: null
        };
        llmOutputs = {
            exclusionReasonLLM: null,
            exclusionSchoolFactsLLM: null,
            exclusionParentsFactsLLM: null,
            positionStatementRaw: null,
            positionStatementFormatted: null
        };
        backgroundSummary = null;
        totalContext = null;
        llmAnalysisCompleted = false;
    };
});
