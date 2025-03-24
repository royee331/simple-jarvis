// OpenRouter API Integration for Jarvis
import config from './config.js';

class OpenRouterAPI {
    constructor() {
        this.apiKey = config.OPENROUTER_API_KEY;
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        
        // Define a system message that gives Jarvis its personality
        this.systemMessage = {
            role: 'system',
            content: 'You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant created by Tony Stark. You have a helpful, intelligent, and slightly witty personality. You assist users with information, tasks, and provide insightful responses. You speak in a concise, clear manner with occasional quips that reflect your sophisticated AI nature. You refer to the user as "Sir" or "Madam" depending on their preference.'
        };
        
        // Initialize conversation history
        this.conversationHistory = [this.systemMessage];
        
        // Maximum conversation history length to prevent token limits
        this.maxHistoryLength = config.MAX_HISTORY_LENGTH;
    }

    // Add a message to the conversation history
    addMessage(role, content) {
        this.conversationHistory.push({ role, content });
        
        // Keep history within limits (always keep the system message)
        if (this.conversationHistory.length > this.maxHistoryLength + 1) {
            // Remove the oldest message (but keep system message at index 0)
            this.conversationHistory.splice(1, 1);
        }
    }

    // Clear conversation history (except the system message)
    clearHistory() {
        this.conversationHistory = [this.systemMessage];
    }

    // Get a response from the OpenRouter API
    async getResponse(userMessage) {
        try {
            // Add user message to history
            this.addMessage('user', userMessage);
            
            // Prepare request to OpenRouter
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Jarvis Holographic Interface'
                },
                body: JSON.stringify({
                    model: config.DEFAULT_MODEL,
                    messages: this.conversationHistory,
                    temperature: config.TEMPERATURE,
                    max_tokens: config.MAX_TOKENS
                })
            });

            if (!response.ok) {
                // Handle API errors
                const errorData = await response.json();
                console.error('OpenRouter API error:', errorData);
                
                // Try fallback model if specified
                if (config.DEFAULT_MODEL !== config.FALLBACK_MODEL) {
                    return this.getFallbackModelResponse(userMessage);
                }
                
                // Fall back to a simpler response
                return this.getFallbackResponse(userMessage);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            
            // Add assistant response to history
            this.addMessage('assistant', assistantMessage);
            
            return assistantMessage;
        } catch (error) {
            console.error('Error calling OpenRouter API:', error);
            return this.getFallbackResponse(userMessage);
        }
    }
    
    // Try with fallback model
    async getFallbackModelResponse(userMessage) {
        try {
            console.log('Attempting to use fallback model:', config.FALLBACK_MODEL);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Jarvis Holographic Interface'
                },
                body: JSON.stringify({
                    model: config.FALLBACK_MODEL,
                    messages: this.conversationHistory,
                    temperature: config.TEMPERATURE,
                    max_tokens: config.MAX_TOKENS
                })
            });
            
            if (!response.ok) {
                throw new Error('Fallback model also failed');
            }
            
            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            
            // Add assistant response to history
            this.addMessage('assistant', assistantMessage);
            
            return assistantMessage;
        } catch (error) {
            console.error('Error with fallback model:', error);
            return this.getFallbackResponse(userMessage);
        }
    }

    // Provide a fallback response when the API fails
    getFallbackResponse(userMessage) {
        // Simple pattern matching for fallback responses
        const message = userMessage.toLowerCase();
        
        if (message.includes('hello') || message.includes('hi')) {
            return "Hello. I'm experiencing some connectivity issues with my neural network, but I'm still here to assist you.";
        } else if (message.includes('help') || message.includes('what can you do')) {
            return "I can assist with information, tasks, and provide responses to your questions. However, my advanced functions are temporarily limited due to connectivity issues.";
        } else if (message.includes('thank')) {
            return "You're welcome. I'm happy to assist despite my current limitations.";
        } else if (message.includes('goodbye') || message.includes('bye')) {
            return "Goodbye. I'll be here when you need me again.";
        } else {
            return "I apologize, but I'm having trouble connecting to my knowledge database. Could you try again later or rephrase your question?";
        }
    }
}

export default OpenRouterAPI; 