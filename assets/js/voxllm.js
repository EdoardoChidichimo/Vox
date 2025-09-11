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
        isPermanentlyExcluded: null,
        exclusionLetterContent: null,
        schoolVersionEvents: null,
        schoolEvidence: null,
        studentAgreesWithSchool: null,
        studentVersionEvents: null,
        witnessesDetails: null,
        studentVoiceHeardDetails: null,
        // Stage 2: About the Young Person
        isSend: null,
        sendDetails: null,
        ehcpDetails: null,
        isEthnicMin: null,
        previousSuspensionsDetails: null,
        familyAwarenessDetails: null,
        personalIssuesDetails: null,
        // Stage 3: About the Procedure
        stage: null,
        governorProcedureInfo: null,
        otherInformationProvided: null,
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
            isPermanentlyExcluded: null,
            exclusionLetterContent: null,
            schoolVersionEvents: null,
            schoolEvidence: null,
            studentAgreesWithSchool: null,
            studentVersionEvents: null,
            witnessesDetails: null,
            studentVoiceHeardDetails: null,
            // Stage 2: About the Young Person
            isSend: null,
            sendDetails: null,
            ehcpDetails: null,
            isEthnicMin: null,
            previousSuspensionsDetails: null,
            familyAwarenessDetails: null,
            personalIssuesDetails: null,
            // Stage 3: About the Procedure
            stage: null,
            governorProcedureInfo: null,
            otherInformationProvided: null,
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
            // Build question queue based on current responses
            buildQuestionQueue();
        }
        
        if (questionQueue.length === 0) {
            // Check if this is because the first question was answered with "No"
            if (userResponses.isPermanentlyExcluded === false) {
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
        askQuestion(currentQuestion);
    }
    
    function buildQuestionQueue() {
        questionQueue = [];
        
        // Stage 1: About the Exclusion
        if (userResponses.isPermanentlyExcluded === null) {
            questionQueue.push('isPermanentlyExcluded');
        }
        
        if (userResponses.isPermanentlyExcluded === true && userResponses.exclusionLetterContent === null) {
            questionQueue.push('exclusionLetterContent');
        }
        
        if (userResponses.isPermanentlyExcluded === true && userResponses.schoolVersionEvents === null) {
            questionQueue.push('schoolVersionEvents');
        }
        
        if (userResponses.isPermanentlyExcluded === true && userResponses.schoolEvidence === null) {
            questionQueue.push('schoolEvidence');
        }
        
        if (userResponses.isPermanentlyExcluded === true && userResponses.studentAgreesWithSchool === null) {
            questionQueue.push('studentAgreesWithSchool');
        }
        
        if (userResponses.isPermanentlyExcluded === true && userResponses.studentVersionEvents === null) {
            questionQueue.push('studentVersionEvents');
        }
        
        if (userResponses.isPermanentlyExcluded === true && userResponses.witnessesDetails === null) {
            questionQueue.push('witnessesDetails');
        }
        
        if (userResponses.isPermanentlyExcluded === true && userResponses.studentVoiceHeardDetails === null) {
            questionQueue.push('studentVoiceHeardDetails');
        }
        
        // If Stage 1 is complete, we can proceed to Stage 2 questions
        // BUT only after LLM analysis is completed
        if (isStage1Complete() && llmAnalysisCompleted) {
            
            // Stage 2: About the Young Person
            if (userResponses.isSend === null) {
                questionQueue.push('isSend');
            } else if (userResponses.isSend === true) {
                // If SEND is yes, add the conditional questions immediately
                if (userResponses.sendDetails === null) {
                    questionQueue.push('sendDetails');
                }
                if (userResponses.ehcpDetails === null) {
                    questionQueue.push('ehcpDetails');
                }
            }
            
            // Add other Stage 2 questions only if SEND is answered (yes or no)
            if (userResponses.isSend !== null) {
                if (userResponses.isEthnicMin === null) {
                    questionQueue.push('isEthnicMin');
                }
                
                if (userResponses.previousSuspensionsDetails === null) {
                    questionQueue.push('previousSuspensionsDetails');
                }
                
                if (userResponses.familyAwarenessDetails === null) {
                    questionQueue.push('familyAwarenessDetails');
                }
                
                if (userResponses.personalIssuesDetails === null) {
                    questionQueue.push('personalIssuesDetails');
                }
            }
        }
        
        // Stage 3: About the Procedure (only if Stage 2 is complete AND background summary is computed)
        if (isStage2Complete() && backgroundSummary && userResponses.stage === null) {
            questionQueue.push('stage');
        }
        
        if (isStage2Complete() && backgroundSummary && userResponses.stage === 'IRP' && userResponses.governorProcedureInfo === null) {
            questionQueue.push('governorProcedureInfo');
        }
        
        // Ask for other information after Stage 3 is complete
        if (isStage3Complete() && userResponses.otherInformationProvided === null) {
            questionQueue.push('otherInformationProvided');
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
        return userResponses.isPermanentlyExcluded === true &&
               userResponses.exclusionLetterContent !== null &&
               userResponses.schoolVersionEvents !== null &&
               userResponses.schoolEvidence !== null &&
               userResponses.studentAgreesWithSchool !== null &&
               userResponses.studentVersionEvents !== null &&
               userResponses.witnessesDetails !== null &&
               userResponses.studentVoiceHeardDetails !== null;
    }
    
    function askQuestion(questionType) {
        switch (questionType) {
            case 'isPermanentlyExcluded':
                addMessage('Has your child been permanently excluded?', 'bot');
                showBooleanOptions();
                break;
            case 'exclusionLetterContent':
                addMessage('Was a letter written to confirm your child\'s exclusion? Please provide the content of the exclusion letter and the reasons given by the school.', 'bot');
                showTextInput();
                break;
            case 'schoolVersionEvents':
                addMessage('What does the school say happened to lead to the exclusion? Please describe the school\'s version of events.', 'bot');
                showTextInput();
                break;
            case 'schoolEvidence':
                addMessage('What evidence does the school have to support the exclusion?', 'bot');
                showTextInput();
                break;
            case 'studentAgreesWithSchool':
                addMessage('Does the young person agree with the school\'s version of events?', 'bot');
                showBooleanOptions();
                break;
            case 'studentVersionEvents':
                addMessage('What is the young person\'s version of events?', 'bot');
                showTextInput();
                break;
            case 'witnessesDetails':
                addMessage('Are there witnesses that can support the young person\'s version of events? Please provide details.', 'bot');
                showTextInput();
                break;
            case 'studentVoiceHeardDetails':
                addMessage('Did the school speak with the young person and take their version of events before excluding them? Please provide details.', 'bot');
                showTextInput();
                break;
            // Stage 2: About the Young Person
            case 'isSend':
                // Add Stage 2 header when first Stage 2 question is asked
                addSectionHeader('— About the Young Person —', 2);
                addMessage('Does the young person have special educational needs or disabilities (SEND)?', 'bot');
                showBooleanOptions();
                break;
            case 'sendDetails':
                addMessage('Please describe the SEND and how the school have made adjustments to address this SEND.', 'bot');
                showTextInput();
                break;
            case 'ehcpDetails':
                addMessage('Does the young person have an EHCP? Please provide details about how the school has implemented it.', 'bot');
                showTextInput();
                break;
            case 'isEthnicMin':
                addMessage('Is the young person from an ethnic minority background?', 'bot');
                showBooleanOptions();
                break;
            case 'previousSuspensionsDetails':
                addMessage('Has the young person been previously suspended? Please provide details and rough dates.', 'bot');
                showTextInput();
                break;
            case 'familyAwarenessDetails':
                addMessage('Were the family aware of behavioural issues, or the risk of exclusion before it happened? Please provide details.', 'bot');
                showTextInput();
                break;
            case 'personalIssuesDetails':
                addMessage('Was/is the young person suffering from any personal issues? (E.g., bereavement, relocation, abuse or neglect, mental health needs, bullying, criminal exploitation, significant challenges at home)', 'bot');
                showTextInput();
                break;
            // Stage 3: About the Procedure
            case 'stage':
                // Add Stage 3 header when first Stage 3 question is asked
                addSectionHeader('— About the Procedure —', 3);
                addMessage('At what stage in the process is your case?', 'bot');
                showSelectOptions(['Governors', 'Independent Review Panel']);
                break;
            case 'governorProcedureInfo':
                addMessage('Please provide details about any procedural issues during the Governors meeting. Did you have any concerns about fairness, time limits, or anything else that seemed odd?', 'bot');
                showTextInput();
                break;
            case 'otherInformationProvided':
                addMessage('Is there any other information you would like to provide that might be relevant to your case? This could include additional evidence, context, or details that haven\'t been covered in our previous questions.', 'bot');
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
            <div class="progress-text">${stepName}...</div>
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
        if (['isSend', 'sendDetails', 'ehcpDetails', 'isEthnicMin', 'previousSuspensionsDetails', 'familyAwarenessDetails', 'personalIssuesDetails'].includes(currentQuestion)) {
            stage = 2;
        } else if (['stage', 'governorProcedureInfo', 'otherInformationProvided'].includes(currentQuestion)) {
            stage = 3;
        } else if (['childName', 'parentName', 'schoolName', 'exclusionDate'].includes(currentQuestion)) {
            stage = 4;
        }
        
        addMessage(responseText, 'user', stage);
        
        // Store the response based on current question
        switch (currentQuestion) {
            case 'isPermanentlyExcluded':
                userResponses.isPermanentlyExcluded = response;
                
                // Check if we need to stop the process
                if (!response) {
                    addMessage('I\'m sorry, but this tool is designed specifically for permanent exclusions. For fixed-term exclusions or other matters, please contact the school directly or seek appropriate legal advice.', 'bot');
                    
                    // Hide the input area and stop the conversation
                    chatInputArea.style.display = 'none';
                    
                    // Clear the question queue to prevent further questions
                    questionQueue = [];
                    currentQuestion = null;
                    
                    return;
                }
                break;
            case 'studentAgreesWithSchool':
                userResponses.studentAgreesWithSchool = response;
                break;
            case 'isSend':
                userResponses.isSend = response;
                break;
            case 'isEthnicMin':
                userResponses.isEthnicMin = response;
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
        if (['isSend', 'sendDetails', 'ehcpDetails', 'isEthnicMin', 'previousSuspensionsDetails', 'familyAwarenessDetails', 'personalIssuesDetails'].includes(currentQuestion)) {
            stage = 2;
        } else if (['stage', 'governorProcedureInfo', 'otherInformationProvided'].includes(currentQuestion)) {
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
            
            // If IRP is selected, immediately add the conditional question to the queue
            if (response === 'Independent Review Panel' && userResponses.governorProcedureInfo === null) {
                questionQueue.push('governorProcedureInfo');
            }
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
        if (['isSend', 'sendDetails', 'ehcpDetails', 'isEthnicMin', 'previousSuspensionsDetails', 'familyAwarenessDetails', 'personalIssuesDetails'].includes(currentQuestion)) {
            stage = 2;
        } else if (['stage', 'governorProcedureInfo', 'otherInformationProvided'].includes(currentQuestion)) {
            stage = 3;
        } else if (['childName', 'parentName', 'schoolName', 'exclusionDate'].includes(currentQuestion)) {
            stage = 4;
        }
        
        addMessage(response, 'user', stage);
        
        // Store the response based on current question
        switch (currentQuestion) {
            case 'exclusionLetterContent':
                userResponses.exclusionLetterContent = response;
                break;
            case 'schoolVersionEvents':
                userResponses.schoolVersionEvents = response;
                break;
            case 'schoolEvidence':
                userResponses.schoolEvidence = response;
                break;
            case 'studentVersionEvents':
                userResponses.studentVersionEvents = response;
                break;
            case 'witnessesDetails':
                userResponses.witnessesDetails = response;
                break;
            case 'studentVoiceHeardDetails':
                userResponses.studentVoiceHeardDetails = response;
                break;
            case 'sendDetails':
                userResponses.sendDetails = response;
                break;
            case 'ehcpDetails':
                userResponses.ehcpDetails = response;
                break;
            case 'previousSuspensionsDetails':
                userResponses.previousSuspensionsDetails = response;
                break;
            case 'familyAwarenessDetails':
                userResponses.familyAwarenessDetails = response;
                break;
            case 'personalIssuesDetails':
                userResponses.personalIssuesDetails = response;
                break;
            case 'governorProcedureInfo':
                userResponses.governorProcedureInfo = response;
                break;
            case 'otherInformationProvided':
                userResponses.otherInformationProvided = response;
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
            console.log('🔄 Stage 1 complete, starting LLM analysis...');
            console.log('📊 Stage 1 completion check:', {
                isStage1Complete: isStage1Complete(),
                llmAnalysisCompleted: llmAnalysisCompleted,
                isPermanentlyExcluded: userResponses.isPermanentlyExcluded
            });

            disableUserInput();
            
            const progressTracker = document.getElementById('progressTracker');
            if (progressTracker) {
                progressTracker.style.display = 'block';
                updateProgressTracker(2);
            }
            
            // Perform Stage 1 LLM analysis synchronously with progress updates
            if (userResponses.isPermanentlyExcluded) {
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
                const progressBar = addProgressBar('Processing Background Summary');
                
                // Small delay to let user read the message
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Simulate computation time for better UX
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const summary = computeBackgroundSummary();
                
                if (progressBar && progressBar.parentNode) {
                    progressBar.remove();
                }
    
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
            const progressBar1 = addProgressBar('Processing Exclusion Reason');
            const exclusionReason = await llmAPI.extractExclusionReason(userResponses.exclusionLetterContent);
            llmOutputs.exclusionReasonLLM = exclusionReason;
            if (progressBar1 && progressBar1.parentNode) {
                progressBar1.remove();
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 2: Synthesise school facts
            const progressBar2 = addProgressBar('Processing School Facts of Exclusion');
            const synthesisedSchoolFacts = await llmAPI.synthesiseSchoolFacts(
                userResponses.exclusionLetterContent,
                userResponses.schoolVersionEvents,
                userResponses.schoolEvidence
            );
            llmOutputs.exclusionSchoolFactsLLM = synthesisedSchoolFacts;
            if (progressBar2 && progressBar2.parentNode) {
                progressBar2.remove();
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 3: Synthesise parents facts
            const progressBar3 = addProgressBar('Processing Parent\'s Facts of Exclusion');
            const synthesisedParentsFacts = await llmAPI.synthesiseParentsFacts(
                userResponses.studentAgreesWithSchool,
                userResponses.studentVersionEvents,
                userResponses.witnessesDetails,
                userResponses.studentVoiceHeardDetails
            );
            llmOutputs.exclusionParentsFactsLLM = synthesisedParentsFacts;
            if (progressBar3 && progressBar3.parentNode) {
                progressBar3.remove();
            }
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
               userResponses.isEthnicMin !== null &&
               userResponses.previousSuspensionsDetails !== null &&
               userResponses.familyAwarenessDetails !== null &&
               userResponses.personalIssuesDetails !== null &&
               // Handle conditional SEND details and EHCP questions
               (userResponses.isSend === false || 
                (userResponses.isSend === true && 
                 userResponses.sendDetails !== null && 
                 userResponses.ehcpDetails !== null));
    }
    
    function isStage3Complete() {
        if (userResponses.stage === 'IRP') {
            return userResponses.governorProcedureInfo !== null && userResponses.otherInformationProvided !== null;
        }
        return userResponses.stage !== null && userResponses.otherInformationProvided !== null; // For 'Governors' stage, need stage selection and other info
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
            summary.push("Young person has SEND.");
            if (userResponses.sendDetails) {
                summary.push(`SEND Details: ${userResponses.sendDetails}.`);
            }
            if (userResponses.ehcpDetails) {
                summary.push(`EHCP Details: ${userResponses.ehcpDetails}.`);
            }
        } else {
            summary.push("Young person does NOT have SEND.");
        }
        
        if (userResponses.isEthnicMin) {
            summary.push("Young person is from ethnic minority background.");
        } else {
            summary.push("Young person is NOT from ethnic minority background.");
        }
        
        if (userResponses.previousSuspensionsDetails) {
            summary.push(`Previous suspensions: ${userResponses.previousSuspensionsDetails}.`);
        } else {
            summary.push("No previous suspensions mentioned.");
        }
        
        if (userResponses.familyAwarenessDetails) {
            summary.push(`Family awareness of behavioural issues, or the risk of exclusion before it happened: ${userResponses.familyAwarenessDetails}.`);
        } else {
            summary.push("No family awareness of behavioural issues, or the risk of exclusion before it happened details provided.");
        }
        
        if (userResponses.personalIssuesDetails) {
            summary.push(`Personal issues: ${userResponses.personalIssuesDetails}.`);
        } else {
            summary.push("No personal issues mentioned.");
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
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Load the required documents
            const suspensionsGuidance = await loadTextFile('/documents/statutory_guidance/suspensions.txt');
            const behaviourInSchoolsGuidance = await loadTextFile('/documents/statutory_guidance/behaviour_in_schools.txt');
            
            let positionStatementGrounds;
            if (userResponses.stage === 'Governors') {
                positionStatementGrounds = await loadTextFile('/documents/governors_panel_arguments.json');
            } else {
                positionStatementGrounds = await loadTextFile('/documents/irp_arguments.json');
            }
            
            // Create stage information
            let stageInfo;
            if (userResponses.stage === 'Governors') {
                stageInfo = 'Stage: Preparing for Governors meeting';
            } else if (userResponses.stage === 'Independent Review Panel') {
                stageInfo = `Stage: Preparing for Independent Review Panel. Information on how the Governors meeting went: ${userResponses.governorProcedureInfo || 'No procedural issues reported'}`;
            } else {
                stageInfo = 'Stage: Unknown';
            }
            
            // Generate the position statement
            const positionStatement = await llmAPI.generatePositionStatement(
                llmOutputs.exclusionReasonLLM,
                llmOutputs.exclusionSchoolFactsLLM,
                llmOutputs.exclusionParentsFactsLLM,
                backgroundSummary.join('\n'),
                suspensionsGuidance,
                behaviourInSchoolsGuidance,
                positionStatementGrounds,
                stageInfo,
                userResponses.otherInformationProvided || 'No additional information provided'
            );
            
            if (progressBar && progressBar.parentNode) {
                progressBar.remove();
            }
            
            // Store the raw position statement
            llmOutputs.positionStatementRaw = positionStatement;
            
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
            console.log('🔍 Debugging positionStatementFormatted:', llmOutputs.positionStatementFormatted);
            if (!llmOutputs.positionStatementFormatted) {
                throw new Error('Position statement formatted data is missing');
            }
            
            let formattedData;
            try {
                formattedData = JSON.parse(llmOutputs.positionStatementFormatted);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                console.error('❌ Raw data:', llmOutputs.positionStatementFormatted);
                throw new Error('Failed to parse position statement data: ' + parseError.message);
            }
            
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
            
            console.log('📤 Sending PDF generation request with data:', data);
            
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            console.log('📥 PDF generation response status:', response.status);
            console.log('📥 PDF generation response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ PDF generation error response:', errorText);
                throw new Error(`PDF generation failed: ${response.statusText} - ${errorText}`);
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
            isPermanentlyExcluded: null,
            exclusionLetterContent: null,
            schoolVersionEvents: null,
            schoolEvidence: null,
            studentAgreesWithSchool: null,
            studentVersionEvents: null,
            witnessesDetails: null,
            studentVoiceHeardDetails: null,
            // Stage 2: About the Young Person
            isSend: null,
            sendDetails: null,
            ehcpDetails: null,
            isEthnicMin: null,
            previousSuspensionsDetails: null,
            familyAwarenessDetails: null,
            personalIssuesDetails: null,
            // Stage 3: About the Procedure
            stage: null,
            governorProcedureInfo: null,
            otherInformationProvided: null,
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
