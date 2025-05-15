document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const promptTextarea = document.getElementById('promptTextarea');
    const sendButton = document.getElementById('sendButton');
    const chatDisplay = document.getElementById('chatDisplay');
    const historyList = document.getElementById('historyList');
    const newChatBtn = document.getElementById('newChatBtn');
    const themeToggle = document.getElementById('themeToggle');
    const filePreview = document.getElementById('filePreview');
    const modelTabs = document.querySelectorAll('.model-tab');
    const modelCheckboxes = document.querySelectorAll('.model-checkbox');
    const quickPrompts = document.querySelectorAll('.quick-prompt');
    
    // State
    let currentChatId = Date.now().toString();
    let chats = {};
    let files = [];
    
    // Initialize
    loadChatHistory();
    updateModelTabs();
    
    // Event Listeners
    sendButton.addEventListener('click', sendPrompt);
    promptTextarea.addEventListener('keydown', handleTextareaKeydown);
    newChatBtn.addEventListener('click', startNewChat);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Model tab switching
    modelTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modelTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateModelTabs();
        });
    });
    
    // Model checkbox toggling
    modelCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('click', () => {
            checkbox.classList.toggle('active');
        });
    });
    
    // Quick prompts
    quickPrompts.forEach(prompt => {
        prompt.addEventListener('click', () => {
            promptTextarea.value = prompt.textContent;
            promptTextarea.focus();
        });
    });
    
    // File attachment (simulated)
    document.querySelector('.tool-btn[title="Attach File"]').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Functions
    function sendPrompt() {
        const prompt = promptTextarea.value.trim();
        if (!prompt) return;
        
        // Get selected models
        const selectedModels = Array.from(document.querySelectorAll('.model-checkbox.active'))
                                  .map(el => el.getAttribute('data-model') || el.querySelector('input').value);
        
        if (selectedModels.length === 0) {
            showToast('Please select at least one AI model');
            return;
        }
        
        // Add user message to chat
        addMessage({
            sender: 'user',
            model: 'user',
            content: prompt,
            timestamp: new Date()
        });
        
        // Clear welcome message if present
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        // Simulate responses from each selected model
        selectedModels.forEach(model => {
            // Show loading indicator
            const loadingId = `loading-${Date.now()}`;
            addMessage({
                id: loadingId,
                sender: 'ai',
                model: model,
                content: 'Thinking...',
                timestamp: new Date(),
                loading: true
            });
            
            // Simulate API call delay
            setTimeout(() => {
                // Remove loading indicator
                const loadingElement = document.getElementById(loadingId);
                if (loadingElement) loadingElement.remove();
                
                // Add actual response
                const response = generateMockResponse(model, prompt);
                addMessage({
                    sender: 'ai',
                    model: model,
                    content: response,
                    timestamp: new Date()
                });
            }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        });
        
        // Add to history
        addToHistory(prompt);
        
        // Clear input
        promptTextarea.value = '';
        files = [];
        updateFilePreview();
        
        // Save chat
        saveChat();
    }
    
    function addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender}-message`;
        if (message.id) messageElement.id = message.id;
        
        const modelName = getModelDisplayName(message.model);
        const modelIcon = getModelIcon(message.model);
        
        messageElement.innerHTML = `
            <div class="message-header">
                <div class="message-sender">
                    ${modelIcon ? `<img src="${modelIcon}" alt="${modelName}">` : ''}
                    <span>${modelName}</span>
                </div>
                <div class="message-time">
                    ${message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
            <div class="message-content">
                ${message.loading ? '<div class="loading-dots"><span></span><span></span><span></span></div>' : formatContent(message.content)}
            </div>
        `;
        
        chatDisplay.appendChild(messageElement);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        
        // Add to current chat in memory
        if (!chats[currentChatId]) {
            chats[currentChatId] = {
                id: currentChatId,
                title: promptTextarea.value.substring(0, 50),
                messages: [],
                createdAt: new Date()
            };
        }
        
        if (!message.loading) {
            chats[currentChatId].messages.push(message);
        }
    }
    
    function formatContent(content) {
        // Simple markdown formatting (in a real app, use a proper markdown library)
        let formatted = content
            .replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        return formatted;
    }
    
    function addToHistory(prompt) {
        if (!chats[currentChatId]) return;
        
        // Update chat title with first prompt if not set
        if (!chats[currentChatId].title || chats[currentChatId].title === 'New Chat') {
            chats[currentChatId].title = prompt.substring(0, 50);
            if (prompt.length > 50) chats[currentChatId].title += '...';
        }
        
        // Update history list
        updateHistoryList();
        saveChatHistory();
    }
    
    function updateHistoryList() {
        historyList.innerHTML = '';
        
        Object.values(chats).sort((a, b) => b.createdAt - a.createdAt).forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            historyItem.textContent = chat.title;
            historyItem.addEventListener('click', () => loadChat(chat.id));
            historyList.appendChild(historyItem);
        });
    }
    
    function loadChat(chatId) {
        currentChatId = chatId;
        chatDisplay.innerHTML = '';
        
        if (chats[chatId] && chats[chatId].messages.length > 0) {
            chats[chatId].messages.forEach(message => addMessage(message));
        } else {
            showWelcomeMessage();
        }
        
        // Update active state in history
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.textContent === chats[chatId].title);
        });
    }
    
    function startNewChat() {
        currentChatId = Date.now().toString();
        chatDisplay.innerHTML = '';
        showWelcomeMessage();
        promptTextarea.value = '';
        files = [];
        updateFilePreview();
    }
    
    function showWelcomeMessage() {
        chatDisplay.innerHTML = `
            <div class="welcome-message">
                <img src="assets/icons/logo.svg" alt="OmniAI" class="welcome-logo">
                <h2>Welcome to OmniAI</h2>
                <p>Send a prompt to multiple AI models simultaneously and compare their responses.</p>
                <div class="quick-prompts">
                    <button class="quick-prompt">Explain quantum computing</button>
                    <button class="quick-prompt">Write a poem about AI</button>
                    <button class="quick-prompt">Debug this code snippet</button>
                </div>
            </div>
        `;
        
        // Re-attach event listeners to quick prompts
        document.querySelectorAll('.quick-prompt').forEach(prompt => {
            prompt.addEventListener('click', () => {
                promptTextarea.value = prompt.textContent;
                promptTextarea.focus();
            });
        });
    }
    
    function handleTextareaKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrompt();
        }
    }
    
    function handleFileSelect(e) {
        const selectedFiles = Array.from(e.target.files);
        files = [...files, ...selectedFiles];
        updateFilePreview();
    }
    
    function updateFilePreview() {
        filePreview.innerHTML = '';
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <button data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            
            fileItem.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                files.splice(index, 1);
                updateFilePreview();
            });
            
            filePreview.appendChild(fileItem);
        });
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', newTheme);
    }
    
    function updateModelTabs() {
        const activeTab = document.querySelector('.model-tab.active');
        const activeModel = activeTab ? activeTab.getAttribute('data-model') : 'all';
        
        modelCheckboxes.forEach(checkbox => {
            const checkboxModel = checkbox.getAttribute('data-model') || checkbox.querySelector('input').value;
            
            if (activeModel === 'all') {
                checkbox.style.display = 'flex';
            } else {
                checkbox.style.display = checkboxModel === activeModel ? 'flex' : 'none';
            }
        });
    }
    
    function generateMockResponse(model, prompt) {
        const responses = {
            'chatgpt': `**ChatGPT Response**\n\nYour prompt: "${prompt}"\n\nHere's a comprehensive response demonstrating ChatGPT's capabilities. In a real implementation, this would be replaced with actual API calls to OpenAI's ChatGPT service.\n\nFor example:\n\n\`\`\`python\n# Sample code to call ChatGPT API\nimport openai\n\nresponse = openai.ChatCompletion.create(\n  model="gpt-4",