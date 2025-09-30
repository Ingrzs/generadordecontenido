import { initApiKeyManager } from './src/services/api.js';
import { setActiveTab } from './src/utils/ui.js';
import { initChatGenerator } from './src/generators/chat.js';
import { initPostTextGenerator } from './src/generators/postText.js';
import { initImagePostGenerator } from './src/generators/postImage.js';
import { initFacebookPostGenerator } from './src/generators/postFacebook.js';
import { initTextEnhancer } from './src/generators/textEnhancer.js';
import { initMemeGenerator } from './src/generators/meme.js';
import { initGraphicPostGenerator } from './src/generators/graphicPost.js';

const App = () => {
    // --- Inicializar controles de pestañas usando delegación de eventos ---
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (event) => {
            // Encuentra el botón de la pestaña que fue clickeado
            const tabButton = event.target.closest('.tab-btn');
            
            // Si se encontró un botón y tiene el atributo data-tab, cambia de pestaña
            if (tabButton && tabButton.dataset.tab) {
                setActiveTab(tabButton.dataset.tab);
            }
        });
    }

    // --- Inicializar todos los módulos ---
    initApiKeyManager();
    initChatGenerator();
    initPostTextGenerator();
    initImagePostGenerator();
    initFacebookPostGenerator();
    initTextEnhancer();
    initMemeGenerator();
    initGraphicPostGenerator();
    
    // --- Establecer estado inicial ---
    setActiveTab('chat');
};

// Ejecutar la aplicación
App();
