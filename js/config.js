// Configuration for Jarvis
const config = {
    // Replace this with your actual OpenRouter API key
    OPENROUTER_API_KEY: 'YOUR_OPENROUTER_API_KEY',
    
    // Default AI model to use
    DEFAULT_MODEL: 'anthropic/claude-3-opus:beta',
    
    // Fallback model if the default is unavailable
    FALLBACK_MODEL: 'openai/gpt-4o',
    
    // Temperature setting for AI responses (0.0-1.0)
    // Lower values are more deterministic, higher values more creative
    TEMPERATURE: 0.7,
    
    // Maximum number of tokens to generate in responses
    MAX_TOKENS: 500,
    
    // How many messages to keep in conversation history
    MAX_HISTORY_LENGTH: 10
};

export default config; 