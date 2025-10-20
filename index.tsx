import { initApiKeyManager } from './src/services/api.js';
import { setActiveTab } from './src/utils/ui.js';
import { initChatGenerator } from './src/generators/chat.js';
import { initPostTextGenerator } from './src/generators/postText.js';
import { initImagePostGenerator } from './src/generators/postImage.js';
import { initFacebookPostGenerator } from './src/generators/postFacebook.js';
import { initTextEnhancer } from './src/generators/textEnhancer.js';
import { initStoriesGenerator } from './src/generators/stories.js';
import { initMemeGenerator } from './src/generators/meme.js';
import { initGraphicPostGenerator } from './src/generators/graphicPost.js';

const App = () => {
    // --- Initialize Tab Controls using Event Delegation ---
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const tabButton = target.closest('.tab-btn');
            // FIX: Use `instanceof HTMLElement` as a type guard to safely access `dataset`.
            if (tabButton instanceof HTMLElement) {
                const tabName = tabButton.dataset.tab;
                if (tabName) {
                    setActiveTab(tabName);
                }
            }
        });
    }

    // --- Initialize All Modules ---
    initApiKeyManager();
    initChatGenerator();
    initPostTextGenerator();
    initImagePostGenerator();
    initFacebookPostGenerator();
    initTextEnhancer();
    initStoriesGenerator();
    initMemeGenerator();
    initGraphicPostGenerator();

    // --- Set Initial State ---
    setActiveTab('chat');
};

App();
