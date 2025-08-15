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
        
        // Start the conversation
        startConversation();
    });
    
    // Also add a simple test click handler
    beginCaseBtn.onclick = function() {
        console.log('Button clicked via onclick!');
    };
    
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
    
    function askNextQuestion() {
        if (questionQueue.length === 0) {
            // Build question queue based on current responses
            buildQuestionQueue();
        }
        
        if (questionQueue.length === 0) {
            // All questions answered, provide summary
            provideCaseSummary();
            return;
        }
        
        currentQuestion = questionQueue.shift();
        askQuestion(currentQuestion);
    }
    
    function buildQuestionQueue() {
        questionQueue = [];
        
        // Stage 1: About the Exclusion
        if (userResponses.existsExclusionLetter === null) {
            questionQueue.push('existsExclusionLetter');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionLetter === null) {
            questionQueue.push('exclusionLetter');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionSchoolFactsInput === null) {
            questionQueue.push('exclusionSchoolFactsInput');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionSchoolEvidenceInput === null) {
            questionQueue.push('exclusionSchoolEvidenceInput');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionSchoolFactsConfirm === null) {
            questionQueue.push('exclusionSchoolFactsConfirm');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionParentsFactsInput === null) {
            questionQueue.push('exclusionParentsFactsInput');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.exclusionParentsFactsWitnessesInput === null) {
            questionQueue.push('exclusionParentsFactsWitnessesInput');
        }
        
        if (userResponses.existsExclusionLetter === true && userResponses.isStudentVoiceHeard === null) {
            questionQueue.push('isStudentVoiceHeard');
        }
        
        // Stage 2: About the Young Person (only if Stage 1 is complete)
        if (isStage1Complete() && userResponses.isSend === null) {
            questionQueue.push('isSend');
        }
        
        if (isStage1Complete() && userResponses.isSend === true && userResponses.isSendSchoolAware === null) {
            questionQueue.push('isSendSchoolAware');
        }
        
        if (isStage1Complete() && userResponses.isSend === true && userResponses.isSendSchoolAware === true && userResponses.sendSchoolAddress === null) {
            questionQueue.push('sendSchoolAddress');
        }
        
        if (isStage1Complete() && userResponses.isSend === true && userResponses.sendWhoSupport === null) {
            questionQueue.push('sendWhoSupport');
        }
        
        if (isStage1Complete() && userResponses.isEhcp === null) {
            questionQueue.push('isEhcp');
        }
        
        if (isStage1Complete() && userResponses.isEthnicMin === null) {
            questionQueue.push('isEthnicMin');
        }
        
        if (isStage1Complete() && userResponses.isPrevSuspend === null) {
            questionQueue.push('isPrevSuspend');
        }
        
        if (isStage1Complete() && userResponses.parentRiskAware === null) {
            questionQueue.push('parentRiskAware');
        }
        
        if (isStage1Complete() && userResponses.contribFactors === null) {
            questionQueue.push('contribFactors');
        }
        
        // Stage 3: About the Procedure (only if Stage 2 is complete)
        if (isStage2Complete() && userResponses.stage === null) {
            questionQueue.push('stage');
        }
        
        if (isStage2Complete() && userResponses.stage === 'IRP' && userResponses.governorProcedureInfo === null) {
            questionQueue.push('governorProcedureInfo');
        }
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
        // Check which stage we're completing
        if (isStage1Complete() && !isStage2Complete()) {
            addMessage('Thank you for providing all the information for Stage 1. I\'m now analysing your case...', 'bot');
            
            // Show progress tracker and update to Stage 2
            const progressTracker = document.getElementById('progressTracker');
            if (progressTracker) {
                progressTracker.style.display = 'block';
                updateProgressTracker(2);
            }
            
            // Perform Stage 1 LLM analysis
            if (userResponses.existsExclusionLetter) {
                setTimeout(async () => {
                    addMessage('🔄 Analysing Stage 1...', 'bot');
                    
                    try {
                        // Extract exclusion reason and store in variable
                        const exclusionReason = await llmAPI.extractExclusionReason(userResponses.exclusionLetter);
                        llmOutputs.exclusionReasonLLM = exclusionReason;
                        
                        // Synthesise school facts and store in variable
                        const synthesisedFacts = await llmAPI.synthesiseSchoolFacts(
                            userResponses.exclusionLetter,
                            userResponses.exclusionSchoolFactsInput,
                            userResponses.exclusionSchoolEvidenceInput
                        );
                        llmOutputs.exclusionSchoolFactsLLM = synthesisedFacts;
                        
                        // Synthesise parents facts and store in variable
                        const parentsFactsSynthesis = await llmAPI.synthesiseParentsFacts(
                            userResponses.exclusionSchoolFactsConfirm,
                            userResponses.exclusionParentsFactsInput,
                            userResponses.exclusionParentsFactsWitnessesInput,
                            userResponses.isStudentVoiceHeard
                        );
                        llmOutputs.exclusionParentsFactsLLM = parentsFactsSynthesis;
                        
                        addMessage('Stage 1 analysis complete! Now let\'s move to Stage 2: About the Young Person.', 'bot');
                        
                        // Add section divider
                        setTimeout(() => {
                            addSectionDivider();
                        }, 1500);
                        
                        // Log the stored variables for debugging/tuning
                        console.log('Stage 1 LLM Outputs stored:', llmOutputs);
                        console.log('User Responses:', userResponses);
                        
                        // Continue to Stage 2
                        setTimeout(() => {
                            askNextQuestion();
                        }, 2000);
                        
                    } catch (error) {
                        console.error('LLM analysis failed:', error);
                        addMessage('Analysis completed with some issues. Please check the console for details.', 'bot');
                    }
                }, 1000);
            }
        } else if (isStage2Complete() && !isStage3Complete()) {
            addMessage('Thank you for providing all the information for Stage 2. Now let\'s move to Stage 3: About the Procedure.', 'bot');
            
            // Add section divider
            setTimeout(() => {
                addSectionDivider();
            }, 1500);
            
            // Continue to Stage 3
            setTimeout(() => {
                askNextQuestion();
            }, 2000);
            
        } else if (isStage3Complete()) {
            addMessage('Thank you for providing all the information for Stage 3. I\'m now analysing your case...', 'bot');
            
            // Update progress tracker to Stage 4
            updateProgressTracker(4);
            
            // Compute background summary
            computeBackgroundSummary();
            
            addMessage('Stage 3 analysis complete! Your case has been processed and analysed.', 'bot');
            
            // Log the stored variables for debugging/tuning
            console.log('Stage 3 completed. Background Summary:', backgroundSummary);
            console.log('All User Responses:', userResponses);
        } else {
            addMessage('To proceed with case analysis, you\'ll need to provide an exclusion letter from the school.', 'bot');
        }
    }
    
    // Helper function to check if Stage 2 is complete
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
    };
});
