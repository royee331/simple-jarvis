import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import OpenRouterAPI from './openrouter-api.js';

// Error handler for the Jarvis Interface
window.addEventListener('error', function(event) {
    console.error('Error occurred:', event.error);
    document.getElementById('loading-screen').innerHTML = `
        <div class="loading-content">
            <p style="color: red">Error loading Jarvis: ${event.error.message}</p>
            <p>Please check the console for details.</p>
        </div>
    `;
});

// Jarvis Assistant class for handling conversations
class JarvisAssistant {
    constructor() {
        this.robotHead = document.getElementById('robot-head');
        this.interactionPanel = document.getElementById('interaction-panel');
        this.conversation = document.getElementById('conversation');
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.micBtn = document.getElementById('mic-btn');
        
        // Initialize the OpenRouter API
        this.openRouter = new OpenRouterAPI();
        
        this.responses = {
            greetings: [
                "Hello, I am Jarvis. How can I assist you today?",
                "Greetings. Jarvis AI assistant at your service.",
                "Welcome back. Jarvis systems online and ready."
            ],
            questions: [
                "I'm processing that request.",
                "Let me analyze that query.",
                "Interesting question. Calculating response."
            ],
            unknown: [
                "I'm not sure I understand. Could you rephrase that?",
                "My systems are having trouble processing that input.",
                "I don't have enough data to respond appropriately."
            ],
            jokes: [
                "Why don't scientists trust atoms? Because they make up everything!",
                "How does a computer get drunk? It takes screenshots!",
                "What do you call a computer that sings? A Dell-a-cappella!"
            ]
        };
        
        this.speechSynthesis = window.speechSynthesis;
        this.setupEventListeners();
        
        // Automatically show the interaction panel when loaded
        setTimeout(() => {
            this.interactionPanel.style.transform = 'translateY(0)';
            this.interactionPanel.classList.add('active');
            this.conversation.classList.add('active');
            
            // Initial greeting
            setTimeout(() => {
                this.addJarvisMessage(this.getRandomResponse('greetings'));
                this.userInput.focus();
            }, 500);
        }, 500);
    }
    
    setupEventListeners() {
        // Click on robot head to show/hide conversation panel
        this.robotHead.addEventListener('click', () => {
            this.interactionPanel.classList.toggle('active');
            this.conversation.classList.toggle('active');
            
            if (this.interactionPanel.classList.contains('active')) {
                this.userInput.focus();
            }
        });
        
        // Send message with button click
        this.sendBtn.addEventListener('click', () => {
            this.handleUserInput();
        });
        
        // Send message with Enter key
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput();
            }
        });
        
        // Handle microphone button
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.userInput.value = transcript;
                setTimeout(() => this.handleUserInput(), 500);
            };
            
            this.micBtn.addEventListener('click', () => {
                this.recognition.start();
                this.micBtn.textContent = '🔴';
                
                setTimeout(() => {
                    if (this.micBtn.textContent === '🔴') {
                        this.recognition.stop();
                        this.micBtn.textContent = '🎤';
                    }
                }, 5000);
            });
            
            this.recognition.onend = () => {
                this.micBtn.textContent = '🎤';
            };
        } else {
            this.micBtn.style.display = 'none';
        }
    }
    
    async handleUserInput() {
        const userMessage = this.userInput.value.trim();
        if (userMessage) {
            this.addUserMessage(userMessage);
            this.userInput.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            try {
                // Get response from OpenRouter API
                const response = await this.openRouter.getResponse(userMessage);
                
                // Hide typing indicator
                this.hideTypingIndicator();
                
                // Add the response to the conversation
                this.addJarvisMessage(response);
            } catch (error) {
                console.error('Error getting response from OpenRouter:', error);
                
                // Hide typing indicator
                this.hideTypingIndicator();
                
                // Fallback to simple pattern matching
                this.processUserMessageFallback(userMessage);
            }
        }
    }
    
    showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'jarvis-message', 'typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        typingIndicator.id = 'typing-indicator';
        this.messagesContainer.appendChild(typingIndicator);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    addJarvisMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'jarvis-message');
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        this.speak(message);
    }
    
    speak(message) {
        if (this.speechSynthesis) {
            // Cancel any ongoing speech
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(message);
            
            // Set default voice parameters
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Analyze message content for emotional cues
            const emotion = this.detectEmotion(message);
            this.applyEmotionalSpeech(utterance, emotion);
            
            // Update robot face to match emotion
            this.updateRobotFace(emotion);
            
            // Find a good voice (preferably male)
            let voices = this.speechSynthesis.getVoices();
            
            // If voices aren't loaded yet, use a timeout
            if (voices.length === 0) {
                setTimeout(() => {
                    voices = this.speechSynthesis.getVoices();
                    this.setVoiceAndSpeak(utterance, voices, emotion);
                }, 200);
            } else {
                this.setVoiceAndSpeak(utterance, voices, emotion);
            }
        }
    }
    
    detectEmotion(message) {
        // Simple text-based emotion detection
        message = message.toLowerCase();
        
        if (message.includes('sorry') || message.includes('apologize') || message.includes('unfortunately') || 
            message.includes('regret') || message.includes('sad') || message.includes('can\'t help')) {
            return 'sad';
        } else if (message.includes('haha') || message.includes('funny') || message.includes('joke') || 
                  message.includes('excellent') || message.includes('great') || message.includes('congratulations')) {
            return 'happy';
        } else if (message.includes('warning') || message.includes('caution') || message.includes('careful') || 
                  message.includes('alert') || message.includes('danger') || message.includes('attention')) {
            return 'warning';
        } else if (message.includes('amazing') || message.includes('wow') || message.includes('incredible') || 
                  message.includes('unexpected') || message.includes('surprised')) {
            return 'surprised';
        } else if (message.includes('analyzing') || message.includes('calculating') || message.includes('processing') || 
                  message.includes('thinking') || message.includes('searching')) {
            return 'thinking';
        } else if (message.includes('error') || message.includes('failed') || message.includes('issue') || 
                  message.includes('problem') || message.includes('cannot') || message.includes('unable')) {
            return 'error';
        } else {
            return 'neutral';
        }
    }
    
    applyEmotionalSpeech(utterance, emotion) {
        // Adjust speech parameters based on emotion
        switch(emotion) {
            case 'happy':
                utterance.rate = 1.1;
                utterance.pitch = 1.2;
                utterance.volume = 1.0;
                break;
            case 'sad':
                utterance.rate = 0.9;
                utterance.pitch = 0.8;
                utterance.volume = 0.8;
                break;
            case 'warning':
                utterance.rate = 1.0;
                utterance.pitch = 1.1;
                utterance.volume = 1.0;
                break;
            case 'surprised':
                utterance.rate = 1.2;
                utterance.pitch = 1.3;
                utterance.volume = 1.0;
                break;
            case 'thinking':
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 0.9;
                break;
            case 'error':
                utterance.rate = 0.9;
                utterance.pitch = 0.9;
                utterance.volume = 1.0;
                break;
            default: // neutral
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
        }
    }
    
    updateRobotFace(emotion) {
        // Remove all emotion classes first
        this.robotHead.classList.remove('happy', 'sad', 'warning', 'surprised', 'thinking', 'error');
        
        // Add appropriate emotion class
        if (emotion !== 'neutral') {
            this.robotHead.classList.add(emotion);
        }
    }
    
    setVoiceAndSpeak(utterance, voices, emotion) {
        // Find a good voice for Jarvis (preferably male)
        const preferredVoice = voices.find(voice => 
            (voice.name.includes('Male') || 
            voice.name.includes('Google UK English Male') || 
            voice.name.includes('Daniel') ||
            voice.name.includes('Tom'))
        ) || voices[0]; // Default to first voice if no good match
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        // Add emotional pauses for more natural speech
        this.addEmotionalPauses(utterance, emotion);
        
        this.robotHead.classList.add('speaking');
        
        utterance.onend = () => {
            this.robotHead.classList.remove('speaking');
            // Keep emotion for a short time after speaking ends
            setTimeout(() => {
                this.robotHead.classList.remove('happy', 'sad', 'warning', 'surprised', 'thinking', 'error');
            }, 1500);
        };
        
        // Add subtle background sounds based on emotion
        this.playBackgroundSound(emotion);
        
        this.speechSynthesis.speak(utterance);
    }
    
    addEmotionalPauses(utterance, emotion) {
        // Add strategic pauses using SSML or by splitting the text
        // This is a simple implementation - more complex SSML would be better
        // but not all browsers support it equally
        
        let text = utterance.text;
        
        // Add pauses after sentences
        text = text.replace(/\.\s+/g, '. <pause> ');
        text = text.replace(/\?\s+/g, '? <pause> ');
        text = text.replace(/\!\s+/g, '! <pause> ');
        
        // Add emphasis based on emotion
        if (emotion === 'warning' || emotion === 'error') {
            text = text.replace(/warning|caution|alert|error|danger|attention/gi, '<emphasis>$&</emphasis>');
        } else if (emotion === 'happy') {
            text = text.replace(/excellent|amazing|wonderful|great/gi, '<emphasis>$&</emphasis>');
        }
        
        // Simple implementation of pauses (we can't use actual SSML in standard SpeechSynthesis)
        text = text.replace(/<pause>/g, '...');
        text = text.replace(/<emphasis>(.*?)<\/emphasis>/g, '$1');
        
        utterance.text = text;
    }
    
    playBackgroundSound(emotion) {
        // This would ideally play subtle background sounds based on emotion
        // For simplicity, we're not actually playing sounds in this demo
        // but in a full implementation you could add subtle UI sounds
        
        // Example implementation:
        /*
        const sound = document.createElement('audio');
        sound.volume = 0.1;
        
        switch(emotion) {
            case 'happy':
                sound.src = 'sounds/happy_tone.mp3';
                break;
            case 'error':
                sound.src = 'sounds/error_tone.mp3';
                break;
            // etc.
        }
        
        sound.play();
        */
    }
    
    // Fallback processing for when the API is unavailable
    processUserMessageFallback(message) {
        message = message.toLowerCase();
        
        // Simple pattern matching
        setTimeout(() => {
            if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
                this.addJarvisMessage(this.getRandomResponse('greetings'));
            } 
            else if (message.includes('joke') || message.includes('funny')) {
                this.addJarvisMessage(this.getRandomResponse('jokes'));
            }
            else if (message.includes('who are you') || message.includes('what is your name')) {
                this.addJarvisMessage("I am JARVIS - Just A Rather Very Intelligent System. I'm here to assist with whatever you need.");
            }
            else if (message.includes('your purpose') || message.includes('what can you do')) {
                this.addJarvisMessage("My purpose is to assist you with information, tasks, and to provide a pleasant interface experience. Think of me as your personal AI assistant.");
            }
            else if (message.includes('time')) {
                const now = new Date();
                this.addJarvisMessage(`The current time is ${now.toLocaleTimeString()}.`);
            }
            else if (message.includes('date') || message.includes('day')) {
                const now = new Date();
                this.addJarvisMessage(`Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`);
            }
            else if (message.includes('weather')) {
                this.addJarvisMessage("I'm sorry, I don't have access to real-time weather data in this demonstration. In a full implementation, I would connect to a weather API to provide you with accurate weather information.");
            }
            else if (message.includes('thank')) {
                this.addJarvisMessage("You're welcome. I'm here to assist you.");
            }
            else if (message.includes('bye') || message.includes('goodbye')) {
                this.addJarvisMessage("Goodbye. I'll be here if you need me.");
                
                // Visual effect for goodbye
                setTimeout(() => {
                    this.interactionPanel.classList.remove('active');
                    this.conversation.classList.remove('active');
                    
                    // Show again after a few seconds
                    setTimeout(() => {
                        this.interactionPanel.classList.add('active');
                        this.conversation.classList.add('active');
                        this.addJarvisMessage("I've returned. Is there anything else you need assistance with?");
                    }, 5000);
                }, 2000);
            }
            else if (message.includes('help')) {
                this.addJarvisMessage("I can assist with various tasks. You can ask me about:\n- The time or date\n- Tell jokes\n- Provide information about myself\n- Simulate other functions of an AI assistant\nJust ask away, and I'll do my best to help!");
            }
            else if (message.includes('?')) {
                this.addJarvisMessage(this.getRandomResponse('questions'));
                
                // Simulate thinking for complex questions
                if (message.length > 15) {
                    setTimeout(() => {
                        this.addJarvisMessage("After analyzing available data, I would need additional context to provide a complete answer. Could you provide more details?");
                    }, 3000);
                }
            }
            else {
                this.addJarvisMessage(this.getRandomResponse('unknown'));
            }
        }, 800);
    }
    
    getRandomResponse(category) {
        const responses = this.responses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

class JarvisInterface {
    constructor() {
        try {
            // Update loading status
            this.updateLoadingStatus("Initializing 3D environment...");
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: document.querySelector('#canvas'),
                antialias: true,
                alpha: true
            });
            
            this.init();
            
            this.updateLoadingStatus("Setting up visual effects...");
            this.setupPostProcessing();
            
            this.updateLoadingStatus("Creating holographic elements...");
            this.createHolographicEffect();
            
            this.animate();
            this.handleResize();
            
            // Initialize Jarvis Assistant after the 3D interface is ready
            this.updateLoadingStatus("Activating Jarvis AI...");
            setTimeout(() => {
                this.assistant = new JarvisAssistant();
                
                // Hide loading screen after everything is initialized
                this.hideLoadingScreen();
            }, 2000);
        } catch (error) {
            console.error('Error initializing Jarvis:', error);
            document.getElementById('loading-screen').innerHTML = `
                <div class="loading-content">
                    <p style="color: red">Error initializing Jarvis: ${error.message}</p>
                    <p>Please check the console for details.</p>
                </div>
            `;
        }
    }
    
    updateLoadingStatus(message) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    hideLoadingScreen() {
        document.getElementById('loading-screen').style.opacity = '0';
        document.getElementById('info').style.opacity = '1';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 500);
    }

    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Camera position
        this.camera.position.z = 5;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Create holographic grid
        this.createGrid();

        // Add controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Hide loading screen after initialization
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            document.getElementById('info').style.opacity = '1';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
            }, 500);
        }, 2000);
    }

    createGrid() {
        const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x00ffff);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85
        );
        this.composer.addPass(bloomPass);
    }

    createHolographicEffect() {
        // Create holographic particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particles);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate particles
        this.particles.rotation.y += 0.001;

        // Update controls
        this.controls.update();

        // Render scene
        this.composer.render();
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Wait for voices to be loaded
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            new JarvisInterface();
        };
        // Fallback in case onvoiceschanged doesn't trigger
        setTimeout(() => {
            new JarvisInterface();
        }, 1000);
    } else {
        new JarvisInterface();
    }
}); 