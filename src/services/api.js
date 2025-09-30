
import { GoogleGenAI } from "@google/genai";

let aiInstance = null;
const API_KEY_STORAGE_KEY = 'googleGenAiApiKey';

export const getAiInstance = () => {
    if (!aiInstance) {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (apiKey) {
            try {
                // IMPORTANT: In a real production app, the API key should be handled on a secure backend.
                // For this client-side example, we are using the key stored in localStorage.
                aiInstance = new GoogleGenAI({ apiKey });
            } catch (e) {
                console.error("Failed to initialize GoogleGenAI:", e);
                alert("Hubo un error al inicializar la API. La clave podría ser inválida.");
                return null;
            }
        }
    }
    return aiInstance;
};

export const initApiKeyManager = () => {
    const apiKeyGroup = document.getElementById('api-key-group');
    const apiKeyInput = document.getElementById('api-key');
    const changeApiKeyBtn = document.getElementById('change-api-key-btn');
    const allGenerateBtns = document.querySelectorAll('#generate-btn, #generate-posts-btn, #generate-image-posts-btn, #fb-generate-btn, #generate-meme-btn');

    const showInput = () => {
        apiKeyGroup.classList.remove('hidden');
        changeApiKeyBtn.classList.add('hidden');
        // Disable all generate buttons when API key is needed
        allGenerateBtns.forEach(btn => {
            if (btn) btn.disabled = true;
        });
    };

    const hideInput = () => {
        apiKeyGroup.classList.add('hidden');
        changeApiKeyBtn.classList.remove('hidden');
        allGenerateBtns.forEach(btn => {
            if (btn) btn.disabled = false;
        });
    };
    
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        hideInput();
        getAiInstance(); // Initialize it
    } else {
        showInput();
    }

    apiKeyInput.addEventListener('change', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem(API_KEY_STORAGE_KEY, key);
            aiInstance = null; // Reset instance to be re-created with the new key
            if(getAiInstance()){
                hideInput();
            } else {
                // If instance creation fails, show input again
                localStorage.removeItem(API_KEY_STORAGE_KEY);
                showInput();
            }
        }
    });

    changeApiKeyBtn.addEventListener('click', () => {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        aiInstance = null;
        apiKeyInput.value = '';
        showInput();
    });
};
