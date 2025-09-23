
import { GoogleGenAI, Type } from "@google/genai";

declare const html2canvas: any;
declare const JSZip: any;

type MessageStatus = 'read' | 'delivered' | 'sent' | 'pending';
type Message = {
    sender: string;
    message?: string;
    imageUrl?: string;
    isSticker?: boolean;
    timestamp: string;
    status?: MessageStatus;
};

type PostTemplateData = {
    profilePic: string;
    name: string;
    username: string;
};

type PostGenMode = 'manual' | 'ai';
type ImagePostGenMode = 'manual' | 'ai-topic' | 'ai-image';
type MemePanelData = { 
    imageUrl?: string; 
    text?: string;
    x: number; // % from left
    y: number; // % from top
    width: number; // % of panel width
};
type MemeTextInteractionState = {
    active: boolean;
    type: 'drag' | 'resize-left' | 'resize-right' | null;
    panelIndex: number | null;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
};


const App = () => {
    // --- Common Elements ---
    const tabChatGenerator = document.getElementById('tab-chat-generator') as HTMLButtonElement;
    const tabPostGenerator = document.getElementById('tab-post-generator') as HTMLButtonElement;
    const tabImagePostGenerator = document.getElementById('tab-image-post-generator') as HTMLButtonElement;
    const tabFacebookPostGenerator = document.getElementById('tab-facebook-post-generator') as HTMLButtonElement;
    const tabMemeGenerator = document.getElementById('tab-meme-generator') as HTMLButtonElement;
    const chatGeneratorView = document.getElementById('chat-generator-view') as HTMLDivElement;
    const postGeneratorView = document.getElementById('post-generator-view') as HTMLDivElement;
    const imagePostGeneratorView = document.getElementById('image-post-generator-view') as HTMLDivElement;
    const facebookPostGeneratorView = document.getElementById('facebook-post-generator-view') as HTMLDivElement;
    const memeGeneratorView = document.getElementById('meme-generator-view') as HTMLDivElement;
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const apiKeyGroup = document.getElementById('api-key-group') as HTMLDivElement;
    const changeApiKeyBtn = document.getElementById('change-api-key-btn') as HTMLButtonElement;


    // --- Chat Generator Elements ---
    const form = document.getElementById('chat-form') as HTMLFormElement;
    const persona1DescInput = document.getElementById('persona1-desc') as HTMLInputElement;
    const persona2DescInput = document.getElementById('persona2-desc') as HTMLInputElement;
    const topicInput = document.getElementById('topic') as HTMLInputElement;
    const toneSelect = document.getElementById('tone') as HTMLSelectElement;
    const styleSelect = document.getElementById('style') as HTMLSelectElement;
    const lengthSelect = document.getElementById('length') as HTMLSelectElement;
    const emojisSelect = document.getElementById('emojis') as HTMLSelectElement;
    const starterSelect = document.getElementById('starter') as HTMLSelectElement;
    const backgroundUpload = document.getElementById('background-upload') as HTMLInputElement;
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    const downloadFullBtn = document.getElementById('download-full-btn') as HTMLButtonElement;
    const downloadChatOnlyBtn = document.getElementById('download-chat-only-btn') as HTMLButtonElement;
    const chatDownloadButtons = document.querySelectorAll('#chat-generator-view .download-button');
    const chatWindow = document.getElementById('chat-window') as HTMLDivElement;
    const chatMessagesContainer = document.getElementById('chat-messages') as HTMLDivElement;
    const loader = document.getElementById('loader') as HTMLDivElement;
    const imageUploadInput = document.getElementById('image-upload-input') as HTMLInputElement;
    const profilePicContainer = document.getElementById('profile-pic-container') as HTMLDivElement;
    const profilePicImg = document.getElementById('profile-pic-img') as HTMLImageElement;
    const profilePicUpload = document.getElementById('profile-pic-upload') as HTMLInputElement;
    const defaultProfileIcon = document.getElementById('default-profile-icon') as unknown as SVGElement;
    const contactNameSpan = document.getElementById('contact-name') as HTMLSpanElement;
    const contactStatusSpan = document.getElementById('contact-status') as HTMLSpanElement;
    const watermarkTextTab = document.getElementById('watermark-text-tab') as HTMLButtonElement;
    const watermarkImageTab = document.getElementById('watermark-image-tab') as HTMLButtonElement;
    const watermarkTextOptions = document.getElementById('watermark-text-options') as HTMLDivElement;
    const watermarkImageOptions = document.getElementById('watermark-image-options') as HTMLDivElement;
    const watermarkTextInput = document.getElementById('watermark-text') as HTMLInputElement;
    const watermarkColorInput = document.getElementById('watermark-color') as HTMLInputElement;
    const watermarkUpload = document.getElementById('watermark-upload') as HTMLInputElement;
    const watermarkSizeSlider = document.getElementById('watermark-size') as HTMLInputElement;
    const watermarkOpacitySlider = document.getElementById('watermark-opacity') as HTMLInputElement;
    const removeWatermarkBtn = document.getElementById('remove-watermark-btn') as HTMLButtonElement;
    const watermarkOverlay = document.getElementById('watermark-overlay') as HTMLDivElement;
    
    // --- Post Generator (Text) Elements ---
    const templateBtnFacebook = document.getElementById('template-btn-facebook') as HTMLButtonElement;
    const templateBtnTwitter = document.getElementById('template-btn-twitter') as HTMLButtonElement;
    const twitterOptionsContainer = document.getElementById('twitter-options-container') as HTMLDivElement;
    const toggleVerifiedBadgeTwitter = document.getElementById('toggle-verified-badge-twitter') as HTMLInputElement;
    const facebookOptionsContainer = document.getElementById('facebook-options-container') as HTMLDivElement;
    const toggleVerifiedBadgeFacebook = document.getElementById('toggle-verified-badge-facebook') as HTMLInputElement;
    const postTextsInput = document.getElementById('post-texts-input') as HTMLTextAreaElement;
    const generatePostsBtn = document.getElementById('generate-posts-btn') as HTMLButtonElement;
    const postPreviewTemplate = document.getElementById('post-preview-template') as HTMLDivElement;
    const postProfilePicDiv = postPreviewTemplate.querySelector('.post-profile-pic') as HTMLDivElement;
    const postProfilePicImg = postPreviewTemplate.querySelector('.post-profile-pic img') as HTMLImageElement;
    const postProfilePicUpload = document.getElementById('post-profile-pic-upload') as HTMLInputElement;
    const postNameSpan = postPreviewTemplate.querySelector('.post-name') as HTMLSpanElement;
    const postUsernameSpan = postPreviewTemplate.querySelector('.post-username') as HTMLSpanElement;
    const postTextP = postPreviewTemplate.querySelector('.post-text') as HTMLParagraphElement;
    const resultsHeader = document.querySelector('#post-results-area .results-header') as HTMLDivElement;
    const resultsGrid = document.getElementById('results-grid') as HTMLDivElement;
    const downloadAllZipBtn = document.getElementById('download-all-zip-btn') as HTMLButtonElement;
    const postGeneratorLoader = document.getElementById('post-generator-loader') as HTMLDivElement;
    const postGeneratorLoaderText = postGeneratorLoader.querySelector('p') as HTMLParagraphElement;
    const textAlignSelector = document.getElementById('text-align-selector') as HTMLDivElement;
    const modeManualBtn = document.getElementById('mode-manual-btn') as HTMLButtonElement;
    const modeAiBtn = document.getElementById('mode-ai-btn') as HTMLButtonElement;
    const manualInputContainer = document.getElementById('manual-input-container') as HTMLDivElement;
    const aiInputContainer = document.getElementById('ai-input-container') as HTMLDivElement;
    const aiTopicInput = document.getElementById('ai-topic') as HTMLInputElement;
    const aiToneSelect = document.getElementById('ai-tone') as HTMLSelectElement;
    const aiQuantityInput = document.getElementById('ai-quantity') as HTMLInputElement;

    // --- Image Post Generator Elements ---
    const imagePostBaseUpload = document.getElementById('image-post-base-upload') as HTMLInputElement;
    const imagePostThumbnailContainer = document.getElementById('image-post-thumbnail-container') as HTMLDivElement;
    const imagePostThumbnail = document.getElementById('image-post-thumbnail') as HTMLImageElement;
    const toggleImagePostHeader = document.getElementById('toggle-image-post-header') as HTMLInputElement;
    const imagePostHeaderOptions = document.getElementById('image-post-header-options') as HTMLDivElement;
    const imagePostTemplateBtnFacebook = document.getElementById('image-post-template-btn-facebook') as HTMLButtonElement;
    const imagePostTemplateBtnTwitter = document.getElementById('image-post-template-btn-twitter') as HTMLButtonElement;
    const imagePostFacebookOptions = document.getElementById('image-post-facebook-options') as HTMLDivElement;
    const imagePostTwitterOptions = document.getElementById('image-post-twitter-options') as HTMLDivElement;
    const toggleImagePostVerifiedFacebook = document.getElementById('toggle-image-post-verified-facebook') as HTMLInputElement;
    const toggleImagePostVerifiedTwitter = document.getElementById('toggle-image-post-verified-twitter') as HTMLInputElement;
    const imagePostFontSelector = document.getElementById('image-post-font-selector') as HTMLSelectElement;
    const imagePostStyleSelector = document.getElementById('image-post-style-selector') as HTMLDivElement;
    const imagePostTextAlignSelector = document.getElementById('image-post-text-align-selector') as HTMLDivElement;
    const imagePostModeManualBtn = document.getElementById('image-post-mode-manual-btn') as HTMLButtonElement;
    const imagePostModeAiTopicBtn = document.getElementById('image-post-mode-ai-topic-btn') as HTMLButtonElement;
    const imagePostModeAiImageBtn = document.getElementById('image-post-mode-ai-image-btn') as HTMLButtonElement;
    const imagePostManualInputContainer = document.getElementById('image-post-manual-input-container') as HTMLDivElement;
    const imagePostAiInputContainer = document.getElementById('image-post-ai-input-container') as HTMLDivElement;
    const imagePostAiTopicGroup = document.getElementById('image-post-ai-topic-group') as HTMLDivElement;
    const imagePostTextsInput = document.getElementById('image-post-texts-input') as HTMLTextAreaElement;
    const imagePostAiTopicInput = document.getElementById('image-post-ai-topic') as HTMLInputElement;
    const imagePostAiToneSelect = document.getElementById('image-post-ai-tone') as HTMLSelectElement;
    const imagePostAiQuantityInput = document.getElementById('image-post-ai-quantity') as HTMLInputElement;
    const generateImagePostsBtn = document.getElementById('generate-image-posts-btn') as HTMLButtonElement;
    const imagePostPreviewContainer = document.getElementById('image-post-preview-container') as HTMLDivElement;
    const imagePostPreviewTemplate = document.getElementById('image-post-preview-template') as HTMLDivElement;
    const imagePostPreviewHeader = imagePostPreviewTemplate.querySelector('.post-header') as HTMLDivElement;
    const imagePostPreviewTitle = imagePostPreviewTemplate.querySelector('.image-post-title') as HTMLParagraphElement;
    const imagePostPreviewImage = imagePostPreviewTemplate.querySelector('.image-post-base-img') as HTMLImageElement;
    const imagePostResultsHeader = document.querySelector('#image-post-results-area .results-header') as HTMLDivElement;
    const imagePostResultsGrid = document.getElementById('image-post-results-grid') as HTMLDivElement;
    const imagePostDownloadAllZipBtn = document.getElementById('image-post-download-all-zip-btn') as HTMLButtonElement;
    const imagePostGeneratorLoader = document.getElementById('image-post-generator-loader') as HTMLDivElement;
    const imagePostGeneratorLoaderText = imagePostGeneratorLoader.querySelector('p') as HTMLParagraphElement;
    const imagePostWatermarkTextTab = document.getElementById('image-post-watermark-text-tab') as HTMLButtonElement;
    const imagePostWatermarkImageTab = document.getElementById('image-post-watermark-image-tab') as HTMLButtonElement;
    const imagePostWatermarkTextOptions = document.getElementById('image-post-watermark-text-options') as HTMLDivElement;
    const imagePostWatermarkImageOptions = document.getElementById('image-post-watermark-image-options') as HTMLDivElement;
    const imagePostWatermarkTextInput = document.getElementById('image-post-watermark-text') as HTMLInputElement;
    const imagePostWatermarkColorInput = document.getElementById('image-post-watermark-color') as HTMLInputElement;
    const imagePostWatermarkUpload = document.getElementById('image-post-watermark-upload') as HTMLInputElement;
    const imagePostWatermarkSizeSlider = document.getElementById('image-post-watermark-size') as HTMLInputElement;
    const imagePostWatermarkOpacitySlider = document.getElementById('image-post-watermark-opacity') as HTMLInputElement;
    const imagePostRemoveWatermarkBtn = document.getElementById('image-post-remove-watermark-btn') as HTMLButtonElement;
    const imagePostWatermarkOverlay = document.getElementById('image-post-watermark-overlay') as HTMLDivElement;

    // --- Facebook Post Generator Elements ---
    const fbPersonNameInput = document.getElementById('fb-person-name') as HTMLInputElement;
    const fbYearSelect = document.getElementById('fb-year-select') as HTMLSelectElement;
    const fbMonthSelect = document.getElementById('fb-month-select') as HTMLSelectElement;
    const fbDaySelect = document.getElementById('fb-day-select') as HTMLSelectElement;
    const fbDateError = document.getElementById('fb-date-error') as HTMLParagraphElement;
    const fbToneSelect = document.getElementById('fb-tone-select') as HTMLSelectElement;
    const fbLengthSelector = document.getElementById('fb-length-selector') as HTMLDivElement;
    const fbGenerateBtn = document.getElementById('fb-generate-btn') as HTMLButtonElement;
    const fbResultsContainer = document.getElementById('fb-results-container') as HTMLDivElement;
    const fbInitialState = document.getElementById('fb-initial-state') as HTMLDivElement;
    const fbLoader = document.getElementById('fb-loader') as HTMLDivElement;
    const fbGeneratedText = document.getElementById('fb-generated-text') as HTMLDivElement;
    const fbCopyBtn = document.getElementById('fb-copy-btn') as HTMLButtonElement;
    const fbSourcesList = document.getElementById('fb-sources-list') as HTMLUListElement;

    // --- Meme Generator Elements ---
    const memeLayoutSelector = document.getElementById('meme-layout-selector') as HTMLDivElement;
    const memeGutterSlider = document.getElementById('meme-gutter-slider') as HTMLInputElement;
    const memeGutterValue = document.getElementById('meme-gutter-value') as HTMLSpanElement;
    const memeBgColorInput = document.getElementById('meme-bg-color') as HTMLInputElement;
    const generateMemeBtn = document.getElementById('generate-meme-btn') as HTMLButtonElement;
    const memeCaptureWrapper = document.getElementById('meme-capture-wrapper') as HTMLDivElement;
    const memeCanvasContainer = document.getElementById('meme-canvas-container') as HTMLDivElement;
    const memeTextInputsContainer = document.getElementById('meme-text-inputs-container') as HTMLDivElement;
    const memeImageUpload = document.getElementById('meme-image-upload') as HTMLInputElement;
    const memeFontSelector = document.getElementById('meme-font-selector') as HTMLSelectElement;
    const memeFontSizeSlider = document.getElementById('meme-font-size-slider') as HTMLInputElement;
    const memeFontSizeValue = document.getElementById('meme-font-size-value') as HTMLSpanElement;
    const memeTextColorInput = document.getElementById('meme-text-color') as HTMLInputElement;
    const memeBorderColorInput = document.getElementById('meme-border-color') as HTMLInputElement;
    const memeBorderThicknessSlider = document.getElementById('meme-border-thickness') as HTMLInputElement;
    const memeBorderThicknessValue = document.getElementById('meme-border-thickness-value') as HTMLSpanElement;
    const memeWatermarkTextTab = document.getElementById('meme-watermark-text-tab') as HTMLButtonElement;
    const memeWatermarkImageTab = document.getElementById('meme-watermark-image-tab') as HTMLButtonElement;
    const memeWatermarkTextOptions = document.getElementById('meme-watermark-text-options') as HTMLDivElement;
    const memeWatermarkImageOptions = document.getElementById('meme-watermark-image-options') as HTMLDivElement;
    const memeWatermarkTextInput = document.getElementById('meme-watermark-text') as HTMLInputElement;
    const memeWatermarkColorInput = document.getElementById('meme-watermark-color') as HTMLInputElement;
    const memeWatermarkUpload = document.getElementById('meme-watermark-upload') as HTMLInputElement;
    const memeWatermarkSizeSlider = document.getElementById('meme-watermark-size') as HTMLInputElement;
    const memeWatermarkOpacitySlider = document.getElementById('meme-watermark-opacity') as HTMLInputElement;
    const memeRemoveWatermarkBtn = document.getElementById('meme-remove-watermark-btn') as HTMLButtonElement;
    const memeWatermarkOverlay = document.getElementById('meme-watermark-overlay') as HTMLDivElement;


    let ai: GoogleGenAI;
    let currentConversation: Message[] = [];
    let imageUploadTarget: { sender: 'Persona 1' | 'Persona 2' | null, index: number | null, isSticker?: boolean } = { sender: null, index: null, isSticker: false };
    let isDraggingWatermark = false;
    let watermarkDragStartX = 0, watermarkDragStartY = 0;
    let watermarkElementStartX = 0, watermarkElementStartY = 0;
    let currentWatermarkType: 'text' | 'image' = 'text';
    let generatedPostCanvases: HTMLCanvasElement[] = [];
    let generatedImagePostCanvases: HTMLCanvasElement[] = [];
    let currentPostGenMode: PostGenMode = 'manual';
    let currentImagePostGenMode: ImagePostGenMode = 'manual';
    let imagePostBase64: string | null = null;
    let isDraggingImagePostWatermark = false;
    let imagePostWatermarkDragStartX = 0, imagePostWatermarkDragStartY = 0;
    let imagePostWatermarkElementStartX = 0, imagePostWatermarkElementStartY = 0;
    let currentImagePostWatermarkType: 'text' | 'image' = 'text';
    let currentFbPostLength: 'corta' | 'media' | 'larga' = 'media';
    let currentMemeLayout = '1f';
    let memePanelData: MemePanelData[] = [];
    let activeMemePanelIndex = 0;
    let isDraggingMemeWatermark = false;
    let memeWatermarkDragStartX = 0, memeWatermarkDragStartY = 0;
    let memeWatermarkElementStartX = 0, memeWatermarkElementStartY = 0;
    let currentMemeWatermarkType: 'text' | 'image' = 'text';
    let memeTextInteraction: MemeTextInteractionState = { active: false, type: null, panelIndex: null, startX: 0, startY: 0, startLeft: 0, startTop: 0, startWidth: 0 };

    const statusSVGs: Record<MessageStatus, string> = {
        read: `<svg viewBox="0 0 18 18" width="18" height="18"><path fill="#4FC3F7" d="M17.394 5.035l-.57-.443a.453.453 0 00-.638.083l-6.2 7.61-3.23-2.84a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l3.99 3.513a.453.453 0 00.613.02l.025-.02 6.917-8.497a.453.453 0 00-.083-.638zM12.56 5.035l-.57-.443a.453.453 0 00-.638.083L5.435 12.29l-1.39-1.22a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l2.147 1.89a.453.453 0 00.613.02l.025-.02 1.48-1.82-.54-.42a.453.453 0 01-.07-.62z"></path></svg>`,
        delivered: `<svg viewBox="0 0 18 18" width="18" height="18"><path fill="#667781" d="M17.394 5.035l-.57-.443a.453.453 0 00-.638.083l-6.2 7.61-3.23-2.84a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l3.99 3.513a.453.453 0 00.613.02l.025-.02 6.917-8.497a.453.453 0 00-.083-.638zM12.56 5.035l-.57-.443a.453.453 0 00-.638.083L5.435 12.29l-1.39-1.22a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l2.147 1.89a.453.453 0 00.613.02l.025-.02 1.48-1.82-.54-.42a.453.453 0 01-.07-.62z"></path></svg>`,
        sent: `<svg viewBox="0 0 18 18" width="18" height="18"><path fill="#667781" d="M17.394 5.035l-.57-.443a.453.453 0 00-.638.083l-6.2 7.61-3.23-2.84a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l3.99 3.513a.453.453 0 00.613.02l.025-.02 6.917-8.497a.453.453 0 00-.083-.638z"></path></svg>`,
        pending: `<svg width="18" height="18" viewBox="0 0 16 16"><path fill="#667781" d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zm0-2A4 4 0 1 1 8 4a4 4 0 0 1 0 8zM7.5 5v3.5L10.5 10l.5-1-2.5-1.5V5h-1z"></path></svg>`
    };
    const statusCycle: MessageStatus[] = ['read', 'delivered', 'sent', 'pending'];
    const trashSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 7H18M9 7V5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5V7M17 7V18C17 18.5304 16.7893 19.0391 16.4142 19.4142C16.0391 19.7893 15.5304 20 15 20H9C8.46957 20 7.96086 19.7893 7.58579 19.4142C7.21071 19.0391 7 18.5304 7 18V7H17Z" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const imageSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    const stickerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`;
    
    const chatSchema = {
        type: Type.OBJECT,
        properties: {
            conversation: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sender: { type: Type.STRING, description: "Identificador del remitente, debe ser 'Persona 1' o 'Persona 2'.", enum: ["Persona 1", "Persona 2"] },
                        message: { type: Type.STRING, description: "El contenido del mensaje de chat." },
                        timestamp: { type: Type.STRING, description: "La hora del mensaje, en formato 'HH:MM AM/PM'." }
                    },
                    required: ["sender", "message", "timestamp"]
                }
            }
        },
        required: ["conversation"]
    };

    const postsSchema = {
        type: Type.OBJECT,
        properties: {
            posts: {
                type: Type.ARRAY,
                description: "Una lista de los textos generados para las publicaciones en redes sociales.",
                items: {
                    type: Type.STRING,
                    description: "El texto de una sola publicación."
                }
            }
        },
        required: ["posts"]
    };

    // --- Centralized State Management for FB Post Generator Button ---
    const updateFbGenerateBtnState = () => {
        const isAiReady = !!ai;
        const isNameEntered = fbPersonNameInput.value.trim() !== '';

        const yearVal = fbYearSelect.value;
        const monthVal = fbMonthSelect.value;
        const dayVal = fbDaySelect.value;

        let isDateValid = true;
        // A date is invalid only if a full, specific date is selected and it's in the future.
        if (yearVal !== 'any' && monthVal !== 'any' && dayVal !== 'any') {
            const year = parseInt(yearVal);
            const month = parseInt(monthVal);
            const day = parseInt(dayVal);

            const selectedDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                fbDateError.classList.remove('hidden');
                isDateValid = false;
            } else {
                fbDateError.classList.add('hidden');
            }
        } else {
            fbDateError.classList.add('hidden');
        }
        
        fbGenerateBtn.disabled = !(isAiReady && isNameEntered && isDateValid);
    };

    // --- Tab Switching Logic ---
    const setActiveTab = (tabName: 'chat' | 'post' | 'image-post' | 'facebook-post' | 'meme') => {
        tabChatGenerator.classList.toggle('active', tabName === 'chat');
        tabPostGenerator.classList.toggle('active', tabName === 'post');
        tabImagePostGenerator.classList.toggle('active', tabName === 'image-post');
        tabFacebookPostGenerator.classList.toggle('active', tabName === 'facebook-post');
        tabMemeGenerator.classList.toggle('active', tabName === 'meme');
        
        chatGeneratorView.classList.toggle('hidden', tabName !== 'chat');
        postGeneratorView.classList.toggle('hidden', tabName !== 'post');
        imagePostGeneratorView.classList.toggle('hidden', tabName !== 'image-post');
        facebookPostGeneratorView.classList.toggle('hidden', tabName !== 'facebook-post');
        memeGeneratorView.classList.toggle('hidden', tabName !== 'meme');
    };

    // --- Common Helper Functions ---
    const makeEditable = (spanElement: HTMLElement, onUpdate?: (newValue: string) => void) => {
        const currentlyEditing = document.querySelector('[contenteditable="true"]');
        if (currentlyEditing) (currentlyEditing as HTMLElement).blur();
        
        spanElement.setAttribute('contenteditable', 'true');
        spanElement.focus();
        
        const onBlur = () => {
            spanElement.setAttribute('contenteditable', 'false');
            if (onUpdate) {
                onUpdate(spanElement.textContent?.trim() || '');
            }
            spanElement.removeEventListener('blur', onBlur);
            spanElement.removeEventListener('keydown', onKeydown);
        };

        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                spanElement.blur();
            }
        };
        
        spanElement.addEventListener('blur', onBlur);
        spanElement.addEventListener('keydown', onKeydown);
    };

    const saveApiKey = (key: string) => localStorage.setItem('gemini-api-key', key);

    const initApiKeyUI = () => {
        const storedKey = localStorage.getItem('gemini-api-key');
        if (storedKey) {
            apiKeyGroup.classList.add('hidden');
            changeApiKeyBtn.classList.remove('hidden');
            try { 
                ai = new GoogleGenAI({ apiKey: storedKey }); 
            } catch(e) { 
                console.error("Fallo al inicializar la IA con la clave guardada:", e); 
                localStorage.removeItem('gemini-api-key'); 
                initApiKeyUI(); 
                return; // Stop execution to avoid calling the updater in a faulty state
            }
        } else {
            apiKeyGroup.classList.remove('hidden');
            changeApiKeyBtn.classList.add('hidden');
            ai = undefined as any; // Clear the AI instance if no key
        }
        updateFbGenerateBtnState(); // Always update the button state
    };

    // --- Helper to initialize AI, to be used by all generators ---
    const initializeAi = (): boolean => {
        if (ai) return true; // Already initialized

        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            try {
                ai = new GoogleGenAI({ apiKey });
                saveApiKey(apiKey);
                initApiKeyUI(); // Hides input, shows 'change' button, and updates button states
                return true;
            } catch (e) {
                console.error("Fallo al inicializar la IA con la nueva clave:", e);
                alert('La clave API proporcionada no es válida. Por favor, verifica e inténtalo de nuevo.');
                return false;
            }
        }
        return false;
    };

    // --- Chat Generator Logic ---
    const getCurrentTimestamp = () => new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    const displayMessages = () => {
        chatMessagesContainer.innerHTML = ''; 
        const createInserter = (index: number) => {
            const inserterDiv = document.createElement('div');
            inserterDiv.className = 'message-inserter';
            inserterDiv.dataset.index = index.toString();
            const lineDiv = document.createElement('div');
            lineDiv.className = 'inserter-line';
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'inserter-buttons';
            const addIncomingTextBtn = document.createElement('button');
            addIncomingTextBtn.title = 'Añadir texto recibido'; addIncomingTextBtn.textContent = '+ Recibido';
            addIncomingTextBtn.onclick = () => addTextMessage('Persona 1', index);
            const addIncomingImageBtn = document.createElement('button');
            addIncomingImageBtn.title = 'Añadir imagen recibida'; addIncomingImageBtn.innerHTML = imageSVG;
            addIncomingImageBtn.onclick = () => { imageUploadTarget = { sender: 'Persona 1', index: index, isSticker: false }; imageUploadInput.click(); };
            const addIncomingStickerBtn = document.createElement('button');
            addIncomingStickerBtn.title = 'Añadir sticker recibido'; addIncomingStickerBtn.innerHTML = stickerSVG;
            addIncomingStickerBtn.onclick = () => { imageUploadTarget = { sender: 'Persona 1', index: index, isSticker: true }; imageUploadInput.click(); };
            const addOutgoingTextBtn = document.createElement('button');
            addOutgoingTextBtn.title = 'Añadir texto enviado'; addOutgoingTextBtn.textContent = '+ Enviado';
            addOutgoingTextBtn.onclick = () => addTextMessage('Persona 2', index);
            const addOutgoingImageBtn = document.createElement('button');
            addOutgoingImageBtn.title = 'Añadir imagen enviada'; addOutgoingImageBtn.innerHTML = imageSVG;
            addOutgoingImageBtn.onclick = () => { imageUploadTarget = { sender: 'Persona 2', index: index, isSticker: false }; imageUploadInput.click(); };
            const addOutgoingStickerBtn = document.createElement('button');
            addOutgoingStickerBtn.title = 'Añadir sticker enviado'; addOutgoingStickerBtn.innerHTML = stickerSVG;
            addOutgoingStickerBtn.onclick = () => { imageUploadTarget = { sender: 'Persona 2', index: index, isSticker: true }; imageUploadInput.click(); };
            buttonsDiv.append(addIncomingTextBtn, addIncomingImageBtn, addIncomingStickerBtn, addOutgoingTextBtn, addOutgoingImageBtn, addOutgoingStickerBtn);
            inserterDiv.append(lineDiv, buttonsDiv);
            return inserterDiv;
        };
        
        if(currentConversation.length === 0) {
            chatMessagesContainer.innerHTML = `<div class="placeholder">Tu chat generado aparecerá aquí...</div>`;
            chatMessagesContainer.appendChild(createInserter(0));
            chatDownloadButtons.forEach(btn => btn.classList.add('hidden'));
            return;
        }

        chatMessagesContainer.appendChild(createInserter(0));
        currentConversation.forEach((msg, index) => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.dataset.index = index.toString();
            const metaDiv = document.createElement('span');
            metaDiv.classList.add('message-meta');
            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('timestamp');
            timestampSpan.textContent = msg.timestamp;
            metaDiv.appendChild(timestampSpan);

            if (msg.sender === 'Persona 2') {
                messageDiv.classList.add('out');
                msg.status = msg.status || 'delivered';
                const statusTicks = document.createElement('span');
                statusTicks.classList.add('status-ticks');
                statusTicks.innerHTML = statusSVGs[msg.status];
                statusTicks.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const currentStatusIndex = statusCycle.indexOf(msg.status!);
                    const nextStatusIndex = (currentStatusIndex + 1) % statusCycle.length;
                    const newStatus = statusCycle[nextStatusIndex];
                    msg.status = newStatus;
                    statusTicks.innerHTML = statusSVGs[newStatus];
                });
                metaDiv.appendChild(statusTicks);
            } else {
                messageDiv.classList.add('in');
            }

            if (msg.imageUrl) {
                if (msg.isSticker) messageDiv.classList.add('sticker-message');
                else messageDiv.classList.add('image-message');
                const image = document.createElement('img');
                image.src = msg.imageUrl;
                image.alt = msg.isSticker ? "Sticker del chat" : "Imagen del chat";
                image.classList.add('message-image');
                messageDiv.appendChild(image);
                messageDiv.appendChild(metaDiv);
            } else {
                const textSpan = document.createElement('span');
                textSpan.appendChild(document.createTextNode(msg.message || ''));
                textSpan.addEventListener('click', () => makeEditable(textSpan, (newValue) => { currentConversation[index].message = newValue; }));
                messageDiv.appendChild(textSpan);
                messageDiv.appendChild(metaDiv);
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('message-actions');
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = trashSVG;
            deleteBtn.title = "Eliminar mensaje";
            deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); currentConversation.splice(index, 1); displayMessages(); });
            actionsDiv.appendChild(deleteBtn);
            messageDiv.appendChild(actionsDiv);
            timestampSpan.addEventListener('click', (e) => { e.stopPropagation(); makeEditable(timestampSpan, (newValue) => { currentConversation[index].timestamp = newValue; }); });
            chatMessagesContainer.appendChild(messageDiv);
            chatMessagesContainer.appendChild(createInserter(index + 1));
        });
        chatDownloadButtons.forEach(btn => btn.classList.remove('hidden'));
    };

    const displayError = (errorMessage: string) => {
        chatMessagesContainer.innerHTML = `<div class="placeholder">${errorMessage}</div>`;
        chatDownloadButtons.forEach(btn => btn.classList.add('hidden'));
    };

    const toggleLoading = (isLoading: boolean) => {
        generateBtn.disabled = isLoading;
        loader.classList.toggle('hidden', !isLoading);
    };

    const generateChat = async (event: SubmitEvent) => {
        event.preventDefault();
        
        if (!initializeAi()) {
            displayError('Por favor, introduce tu clave API de Google AI Studio para generar el chat.');
            return;
        }

        const topic = topicInput.value;
        if (!topic) {
            displayError('Por favor, introduce un tema para la conversación.');
            return;
        }
        
        toggleLoading(true);
        chatDownloadButtons.forEach(btn => btn.classList.add('hidden'));
        chatMessagesContainer.innerHTML = '';
        
        const prompt = `Genera una conversación de chat de WhatsApp falsa de longitud "${lengthSelect.value}" entre dos personas, "Persona 1" y "Persona 2".
Parámetros:
- Tema: ${topic}
- Tono: ${toneSelect.value}
- Estilo de escritura: ${styleSelect.value}
${persona1DescInput.value.trim() || persona2DescInput.value.trim() ? `- Descripciones de los participantes:\n  - Persona 1 (el receptor): ${persona1DescInput.value.trim()}\n  - Persona 2 (el emisor): ${persona2DescInput.value.trim()}` : ''}
- Emojis: ${emojisSelect.value === 'con emojis' ? 'incluir emojis de forma apropiada' : 'no incluir ningún emoji'}
- Quién inicia: "${starterSelect.value}"

La respuesta DEBE ser un único objeto JSON válido, sin formato Markdown (sin \`\`\`json). El objeto debe tener una sola clave "conversation", que es un array de objetos. Cada objeto en el array representa un mensaje y debe tener las siguientes claves:
- "sender": (string) "Persona 1" o "Persona 2".
- "message": (string) El contenido del mensaje.
- "timestamp": (string) La hora del mensaje, en formato 'HH:MM AM/PM'.`;
        
        try {
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            
            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                 jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }

            const parsedJson = JSON.parse(jsonString);

            if (parsedJson.conversation && parsedJson.conversation.length > 0) {
                currentConversation = parsedJson.conversation;
                displayMessages();
            } else {
                throw new Error("La respuesta de la IA no contenía una conversación válida.");
            }
        } catch (error) {
            console.error("Error al generar el chat:", error);
            displayError((error as Error).message.includes("API key not valid") ? "Tu clave API no es válida. Por favor, usa otra." : "Lo siento, ocurrió un error al generar el chat. Inténtalo de nuevo.");
        } finally {
            toggleLoading(false);
        }
    };
    
    const addTextMessage = (sender: 'Persona 1' | 'Persona 2', index: number) => {
        const newMessage: Message = { sender: sender, message: 'Nuevo mensaje...', timestamp: getCurrentTimestamp(), status: sender === 'Persona 2' ? 'delivered' : undefined };
        currentConversation.splice(index, 0, newMessage);
        displayMessages();
        const messageEl = chatMessagesContainer.querySelector(`[data-index="${index}"]`) as HTMLElement;
        if (messageEl) { const textSpan = messageEl.querySelector('span:not(.timestamp):not(.message-meta)') as HTMLSpanElement; if (textSpan) { makeEditable(textSpan, (newValue) => { newMessage.message = newValue; }); const range = document.createRange(); range.selectNodeContents(textSpan); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); } }
    };

    const downloadChatScreenshot = async (elementToCapture: HTMLElement, fileName: string) => {
        const currentlyEditing = document.querySelector('[contenteditable="true"]');
        if (currentlyEditing) (currentlyEditing as HTMLElement).blur();
        const watermarkVisible = !watermarkOverlay.classList.contains('hidden');
        const shouldMoveWatermark = elementToCapture === chatMessagesContainer && watermarkVisible;
        const originalWatermarkParent = watermarkOverlay.parentElement; const originalWatermarkTop = watermarkOverlay.style.top; const originalWatermarkLeft = watermarkOverlay.style.left; const originalMessagesPosition = chatMessagesContainer.style.position;
        if (shouldMoveWatermark) { const chatHeader = document.getElementById('chat-header') as HTMLDivElement; const newTop = watermarkOverlay.offsetTop - chatHeader.offsetHeight; chatMessagesContainer.style.position = 'relative'; chatMessagesContainer.appendChild(watermarkOverlay); watermarkOverlay.style.top = `${newTop}px`; }
        try {
            const canvas = await html2canvas(elementToCapture, { useCORS: true, backgroundColor: null, onclone: (doc) => { const clonedElement = doc.getElementById(elementToCapture.id); if (clonedElement) { clonedElement.querySelectorAll('.message-inserter, .message-actions').forEach(el => (el as HTMLElement).style.display = 'none'); } } });
            const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        } catch (error) { console.error("Error al generar la captura:", error); alert("No se pudo generar la captura de pantalla."); } finally { if (shouldMoveWatermark && originalWatermarkParent) { originalWatermarkParent.appendChild(watermarkOverlay); watermarkOverlay.style.top = originalWatermarkTop; watermarkOverlay.style.left = originalWatermarkLeft; chatMessagesContainer.style.position = originalMessagesPosition; } }
    };

    const handleBackgroundChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    const imageUrl = `url('${e.target.result}')`;
                    chatMessagesContainer.style.backgroundImage = imageUrl; chatWindow.style.backgroundImage = imageUrl;
                    chatMessagesContainer.style.backgroundSize = 'auto'; chatWindow.style.backgroundSize = 'auto';
                    chatMessagesContainer.style.backgroundRepeat = 'repeat'; chatWindow.style.backgroundRepeat = 'repeat';
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };
    
    // --- Watermark Logic ---
    const updateWatermark = () => {
        watermarkOverlay.classList.remove('hidden'); const opacity = watermarkOpacitySlider.value; const size = watermarkSizeSlider.value;
        watermarkOverlay.style.opacity = (parseInt(opacity) / 100).toString();
        if (currentWatermarkType === 'text') {
            const text = watermarkTextInput.value; const color = watermarkColorInput.value;
            if (!text) { watermarkOverlay.classList.add('hidden'); return; }
            watermarkOverlay.innerHTML = `<span>${text}</span>`;
            const span = watermarkOverlay.querySelector('span');
            if (span) { span.style.color = color; span.style.fontSize = `${size}px`; }
            watermarkOverlay.style.width = 'auto'; watermarkOverlay.style.height = 'auto';
        } else { const imageEl = watermarkOverlay.querySelector('img'); if (!imageEl) { watermarkOverlay.classList.add('hidden'); return; } watermarkOverlay.style.width = `${parseInt(size) * 3}px`; watermarkOverlay.style.height = 'auto'; }
    };
    const handleWatermarkImageUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) { watermarkOverlay.innerHTML = `<img src="${e.target.result as string}" alt="watermark">`; updateWatermark(); } }; reader.readAsDataURL(input.files[0]); }
    };
    const removeWatermark = () => { watermarkOverlay.classList.add('hidden'); watermarkOverlay.innerHTML = ''; watermarkTextInput.value = ''; watermarkUpload.value = ''; };
    const startWatermarkDrag = (e: MouseEvent) => { e.preventDefault(); isDraggingWatermark = true; watermarkDragStartX = e.clientX; watermarkDragStartY = e.clientY; watermarkElementStartX = watermarkOverlay.offsetLeft; watermarkElementStartY = watermarkOverlay.offsetTop; document.addEventListener('mousemove', doWatermarkDrag); document.addEventListener('mouseup', stopWatermarkDrag); };
    const doWatermarkDrag = (e: MouseEvent) => { if (!isDraggingWatermark) return; e.preventDefault(); const dx = e.clientX - watermarkDragStartX; const dy = e.clientY - watermarkDragStartY; let newTop = Math.max(0, Math.min(watermarkElementStartY + dy, chatWindow.clientHeight - watermarkOverlay.offsetHeight)); let newLeft = Math.max(0, Math.min(watermarkElementStartX + dx, chatWindow.clientWidth - watermarkOverlay.offsetWidth)); watermarkOverlay.style.top = `${newTop}px`; watermarkOverlay.style.left = `${newLeft}px`; };
    const stopWatermarkDrag = () => { isDraggingWatermark = false; document.removeEventListener('mousemove', doWatermarkDrag); document.removeEventListener('mouseup', stopWatermarkDrag); };


    // --- Post Generator (Text) Logic ---
    const savePostTemplateData = () => {
        const data: PostTemplateData = {
            profilePic: postProfilePicImg.src,
            name: postNameSpan.textContent || 'Nombre Apellido',
            username: postUsernameSpan.textContent || '@usuario'
        };
        localStorage.setItem('postGeneratorTemplateData', JSON.stringify(data));
    };

    const loadPostTemplateData = () => {
        const savedData = localStorage.getItem('postGeneratorTemplateData');
        if (savedData) {
            try {
                const data: PostTemplateData = JSON.parse(savedData);
                if (data.profilePic) postProfilePicImg.src = data.profilePic;
                if (data.name) postNameSpan.textContent = data.name;
                if (data.username) postUsernameSpan.textContent = data.username;
            } catch (e) {
                console.error("Error al cargar los datos de la plantilla de post:", e);
            }
        }
    };
    
    const updateVerifiedBadgeVisibility = () => {
        const isFacebook = postPreviewTemplate.classList.contains('facebook');
        if (isFacebook) {
            postPreviewTemplate.classList.toggle('show-verified', toggleVerifiedBadgeFacebook.checked);
        } else { // Assumes twitter is the only other option
            postPreviewTemplate.classList.toggle('show-verified', toggleVerifiedBadgeTwitter.checked);
        }
    };

    const setActiveTemplate = (templateName: 'facebook' | 'twitter') => {
        if (templateName === 'facebook') {
            templateBtnFacebook.classList.add('active');
            templateBtnTwitter.classList.remove('active');
            postPreviewTemplate.className = 'post-template facebook';
            twitterOptionsContainer.classList.add('hidden');
            facebookOptionsContainer.classList.remove('hidden');
        } else {
            templateBtnFacebook.classList.remove('active');
            templateBtnTwitter.classList.add('active');
            postPreviewTemplate.className = 'post-template twitter';
            twitterOptionsContainer.classList.remove('hidden');
            facebookOptionsContainer.classList.add('hidden');
        }
        updateVerifiedBadgeVisibility();
    };

    const handlePostProfilePicUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    postProfilePicImg.src = e.target.result as string;
                    savePostTemplateData();
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    const switchPostGenMode = (mode: PostGenMode) => {
        currentPostGenMode = mode;
        if (mode === 'ai') {
            modeAiBtn.classList.add('active');
            modeManualBtn.classList.remove('active');
            aiInputContainer.classList.remove('hidden');
            manualInputContainer.classList.add('hidden');
            generatePostsBtn.textContent = 'Generar Contenido y Posts';
        } else {
            modeManualBtn.classList.add('active');
            modeAiBtn.classList.remove('active');
            manualInputContainer.classList.remove('hidden');
            aiInputContainer.classList.add('hidden');
            generatePostsBtn.textContent = 'Generar Posts';
        }
    };

    const togglePostLoading = (isLoading: boolean, message = 'Generando imágenes...') => {
        postGeneratorLoaderText.textContent = message;
        postGeneratorLoader.classList.toggle('hidden', !isLoading);
        generatePostsBtn.disabled = isLoading;
    };

    const generatePostTextsWithAI = async (): Promise<string[]> => {
        if (!initializeAi()) {
            throw new Error('Por favor, introduce tu clave API para usar la generación con IA.');
        }

        const topic = aiTopicInput.value.trim();
        if (!topic) {
            throw new Error('Por favor, introduce un tema principal para la generación con IA.');
        }
        const tone = aiToneSelect.value;
        const quantity = aiQuantityInput.value;

        const prompt = `Actúa como un experto en redes sociales. Genera ${quantity} textos para publicaciones en redes sociales sobre el siguiente tema: "${topic}". El tono debe ser ${tone}. No incluyas hashtags. La respuesta debe ser un objeto JSON que siga el esquema proporcionado.`;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: postsSchema }
            });
            const parsedJson = JSON.parse(response.text.trim());
            if (parsedJson.posts && parsedJson.posts.length > 0) {
                return parsedJson.posts;
            } else {
                throw new Error("La IA no devolvió ninguna publicación.");
            }
        } catch (error) {
            console.error("Error al generar texto con IA:", error);
            throw new Error("Fallo al generar textos con la IA. Revisa la consola para más detalles.");
        }
    };
    
    const generatePostImages = async (texts: string[]) => {
        resultsGrid.innerHTML = '';
        resultsHeader.classList.add('hidden');
        generatedPostCanvases = [];
    
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
    
        for (const [index, text] of texts.entries()) {
            const postClone = postPreviewTemplate.cloneNode(true) as HTMLDivElement;
            const textElement = postClone.querySelector('.post-text') as HTMLParagraphElement;
            if (textElement) {
                textElement.textContent = text;
            }
            tempContainer.appendChild(postClone);
    
            try {
                const canvas = await html2canvas(postClone, { useCORS: true, backgroundColor: '#ffffff' });
                generatedPostCanvases.push(canvas);
                
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-single-btn';
                downloadBtn.textContent = 'Descargar';
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = img.src;
                    link.download = `post_${index + 1}.png`;
                    link.click();
                };
                
                resultItem.appendChild(img);
                resultItem.appendChild(downloadBtn);
                resultsGrid.appendChild(resultItem);
    
            } catch (error) {
                console.error(`Error al generar la imagen para el post ${index + 1}:`, error);
            }
            tempContainer.removeChild(postClone);
        }
        
        document.body.removeChild(tempContainer);
        if (generatedPostCanvases.length > 0) {
            resultsHeader.classList.remove('hidden');
        }
    };

    const generatePosts = async () => {
        togglePostLoading(true, 'Iniciando generación...');
        try {
            let textsToGenerate: string[] = [];

            if (currentPostGenMode === 'ai') {
                togglePostLoading(true, 'Generando textos con IA...');
                const generatedTexts = await generatePostTextsWithAI();
                textsToGenerate = generatedTexts;
                postTextsInput.value = generatedTexts.join('\n');
            } else {
                textsToGenerate = postTextsInput.value.split('\n').filter(line => line.trim() !== '');
                if (textsToGenerate.length === 0) {
                    alert('Por favor, pega al menos un texto para generar un post.');
                    togglePostLoading(false);
                    return;
                }
            }

            togglePostLoading(true, 'Creando imágenes de posts...');
            await generatePostImages(textsToGenerate);

        } catch (error) {
            console.error("Error en el proceso de generación de posts:", error);
            alert(`Ocurrió un error: ${(error as Error).message}`);
        } finally {
            togglePostLoading(false);
        }
    };

    const downloadAllAsZip = async (canvases: HTMLCanvasElement[], zipName: string) => {
        if (canvases.length === 0) return;
        
        const zip = new JSZip();
        
        canvases.forEach((canvas, index) => {
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];
            zip.file(`post_${index + 1}.png`, base64Data, { base64: true });
        });
        
        zip.generateAsync({ type: 'blob' }).then((content) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = zipName;
            link.click();
            URL.revokeObjectURL(link.href);
        });
    };


    // --- Image Post Generator Logic ---
    const handleImageBaseUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    imagePostBase64 = e.target.result as string;
                    imagePostPreviewImage.src = imagePostBase64;
                    imagePostThumbnail.src = imagePostBase64;
                    imagePostThumbnailContainer.classList.remove('hidden');
                    imagePostModeAiImageBtn.disabled = false;
                    imagePostModeAiImageBtn.title = 'Sugerir títulos basados en tu imagen';
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    const switchImagePostGenMode = (mode: ImagePostGenMode) => {
        currentImagePostGenMode = mode;
        imagePostModeManualBtn.classList.toggle('active', mode === 'manual');
        imagePostModeAiTopicBtn.classList.toggle('active', mode === 'ai-topic');
        imagePostModeAiImageBtn.classList.toggle('active', mode === 'ai-image');

        imagePostManualInputContainer.classList.toggle('hidden', mode !== 'manual');
        imagePostAiInputContainer.classList.toggle('hidden', mode === 'manual');
        imagePostAiTopicGroup.classList.toggle('hidden', mode === 'ai-image');

        if (mode === 'manual') {
            generateImagePostsBtn.textContent = 'Generar Posts con Imagen';
        } else if (mode === 'ai-topic') {
            generateImagePostsBtn.textContent = 'Generar Títulos y Posts';
        } else { // ai-image
            generateImagePostsBtn.textContent = 'Sugerir y Generar Posts';
        }
    };

    const toggleImagePostLoading = (isLoading: boolean, message = 'Generando imágenes...') => {
        imagePostGeneratorLoaderText.textContent = message;
        imagePostGeneratorLoader.classList.toggle('hidden', !isLoading);
        generateImagePostsBtn.disabled = isLoading;
    };

    const updateImagePostWatermark = () => {
        imagePostWatermarkOverlay.classList.remove('hidden');
        const opacity = imagePostWatermarkOpacitySlider.value;
        const size = imagePostWatermarkSizeSlider.value;
        imagePostWatermarkOverlay.style.opacity = (parseInt(opacity) / 100).toString();
    
        if (currentImagePostWatermarkType === 'text') {
            const text = imagePostWatermarkTextInput.value;
            const color = imagePostWatermarkColorInput.value;
            if (!text) {
                imagePostWatermarkOverlay.classList.add('hidden');
                return;
            }
            imagePostWatermarkOverlay.innerHTML = `<span>${text}</span>`;
            const span = imagePostWatermarkOverlay.querySelector('span');
            if (span) {
                span.style.color = color;
                span.style.fontSize = `${size}px`;
            }
            imagePostWatermarkOverlay.style.width = 'auto';
            imagePostWatermarkOverlay.style.height = 'auto';
        } else {
            const imageEl = imagePostWatermarkOverlay.querySelector('img');
            if (!imageEl) {
                imagePostWatermarkOverlay.classList.add('hidden');
                return;
            }
            imagePostWatermarkOverlay.style.width = `${parseInt(size) * 3}px`;
            imagePostWatermarkOverlay.style.height = 'auto';
        }
    };

    const handleImagePostWatermarkImageUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    imagePostWatermarkOverlay.innerHTML = `<img src="${e.target.result as string}" alt="watermark">`;
                    updateImagePostWatermark();
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };
    
    const removeImagePostWatermark = () => {
        imagePostWatermarkOverlay.classList.add('hidden');
        imagePostWatermarkOverlay.innerHTML = '';
        imagePostWatermarkTextInput.value = '';
        imagePostWatermarkUpload.value = '';
    };

    const startImagePostWatermarkDrag = (e: MouseEvent) => {
        e.preventDefault();
        isDraggingImagePostWatermark = true;
        imagePostWatermarkDragStartX = e.clientX;
        imagePostWatermarkDragStartY = e.clientY;
        imagePostWatermarkElementStartX = imagePostWatermarkOverlay.offsetLeft;
        imagePostWatermarkElementStartY = imagePostWatermarkOverlay.offsetTop;
        document.addEventListener('mousemove', doImagePostWatermarkDrag);
        document.addEventListener('mouseup', stopImagePostWatermarkDrag);
    };
    
    const doImagePostWatermarkDrag = (e: MouseEvent) => {
        if (!isDraggingImagePostWatermark) return;
        e.preventDefault();
        const dx = e.clientX - imagePostWatermarkDragStartX;
        const dy = e.clientY - imagePostWatermarkDragStartY;
        let newTop = Math.max(0, Math.min(imagePostWatermarkElementStartY + dy, imagePostPreviewContainer.clientHeight - imagePostWatermarkOverlay.offsetHeight));
        let newLeft = Math.max(0, Math.min(imagePostWatermarkElementStartX + dx, imagePostPreviewContainer.clientWidth - imagePostWatermarkOverlay.offsetWidth));
        imagePostWatermarkOverlay.style.top = `${newTop}px`;
        imagePostWatermarkOverlay.style.left = `${newLeft}px`;
    };
    
    const stopImagePostWatermarkDrag = () => {
        isDraggingImagePostWatermark = false;
        document.removeEventListener('mousemove', doImagePostWatermarkDrag);
        document.removeEventListener('mouseup', stopImagePostWatermarkDrag);
    };

    const generateImagePostTextsWithAI = async (): Promise<string[]> => {
        if (!initializeAi()) {
            throw new Error('Por favor, introduce tu clave API para usar la generación con IA.');
        }
        
        const tone = imagePostAiToneSelect.value;
        const quantity = imagePostAiQuantityInput.value;
        let prompt = '';
        let contents: string | { parts: any[] };

        if (currentImagePostGenMode === 'ai-image') {
            if (!imagePostBase64) {
                throw new Error("No hay imagen subida para analizar.");
            }
            prompt = `Analiza esta imagen y genera ${quantity} títulos cortos o frases para colocar sobre ella, para una publicación en redes sociales. El tono debe ser ${tone}. No incluyas hashtags ni comillas. La respuesta debe ser un objeto JSON que siga el esquema proporcionado.`;
            
            const parts = imagePostBase64.split(';');
            const mimeType = parts[0].split(':')[1];
            const base64Data = parts[1].split(',')[1];

            const imagePart = { inlineData: { mimeType, data: base64Data } };
            const textPart = { text: prompt };
            contents = { parts: [imagePart, textPart] };

        } else { // 'ai-topic'
            const topic = imagePostAiTopicInput.value.trim();
            if (!topic) throw new Error('Por favor, introduce un tema principal para la generación con IA.');
            prompt = `Actúa como un experto en redes sociales. Genera ${quantity} títulos cortos o frases para colocar sobre una imagen, sobre el tema: "${topic}". El tono debe ser ${tone}. No incluyas hashtags ni comillas. La respuesta debe ser un objeto JSON que siga el esquema proporcionado.`;
            contents = prompt;
        }

        try {
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents, config: { responseMimeType: "application/json", responseSchema: postsSchema } });
            const parsedJson = JSON.parse(response.text.trim());
            if (parsedJson.posts && parsedJson.posts.length > 0) return parsedJson.posts;
            else throw new Error("La IA no devolvió ninguna publicación.");
        } catch (error) {
            console.error("Error al generar texto con IA para posts de imagen:", error);
            throw new Error("Fallo al generar textos con la IA.");
        }
    };

    const generateImagePostImages = async (titles: string[]) => {
        if (!imagePostBase64) return;
        imagePostResultsGrid.innerHTML = '';
        imagePostResultsHeader.classList.add('hidden');
        generatedImagePostCanvases = [];
    
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute'; tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);

        const isWatermarkActive = !imagePostWatermarkOverlay.classList.contains('hidden');
    
        for (const [index, title] of titles.entries()) {
            const postClone = imagePostPreviewTemplate.cloneNode(true) as HTMLDivElement;
            (postClone.querySelector('.image-post-title') as HTMLParagraphElement).textContent = title;
            (postClone.querySelector('.image-post-base-img') as HTMLImageElement).src = imagePostBase64;

            if (isWatermarkActive) {
                postClone.style.position = 'relative'; // Set positioning context on the parent
                
                const watermarkClone = imagePostWatermarkOverlay.cloneNode(true) as HTMLDivElement;
                
                // Manually apply styles defined in CSS via ID, as cloneNode doesn't copy them.
                watermarkClone.style.position = 'absolute'; // CRITICAL FIX for positioning and stretching
                watermarkClone.style.zIndex = '5';
                watermarkClone.style.display = 'flex';
                watermarkClone.style.alignItems = 'center';
                watermarkClone.style.justifyContent = 'center';
                
                // Apply text shadow if it's a text watermark
                const span = watermarkClone.querySelector('span');
                if (span) {
                    span.style.textShadow = '0px 1px 3px rgba(0, 0, 0, 0.5)';
                }

                // Calculate position relative to the template
                const templateRect = imagePostPreviewTemplate.getBoundingClientRect();
                const overlayRect = imagePostWatermarkOverlay.getBoundingClientRect();
                
                const relativeLeft = overlayRect.left - templateRect.left;
                const relativeTop = overlayRect.top - templateRect.top;
                
                // Apply position and dimensions. Inline styles from the original are copied by cloneNode.
                watermarkClone.style.left = `${relativeLeft}px`;
                watermarkClone.style.top = `${relativeTop}px`;
                watermarkClone.style.width = `${overlayRect.width}px`;
                watermarkClone.style.height = `${overlayRect.height}px`;

                postClone.appendChild(watermarkClone);
            }

            tempContainer.appendChild(postClone);
    
            try {
                const canvas = await html2canvas(postClone, { useCORS: true, backgroundColor: '#ffffff' });
                generatedImagePostCanvases.push(canvas);
                
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-single-btn';
                downloadBtn.textContent = 'Descargar';
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = img.src;
                    link.download = `post_imagen_${index + 1}.png`;
                    link.click();
                };
                
                resultItem.appendChild(img);
                resultItem.appendChild(downloadBtn);
                imagePostResultsGrid.appendChild(resultItem);
            } catch (error) {
                console.error(`Error al generar la imagen para el post ${index + 1}:`, error);
            }
            tempContainer.removeChild(postClone);
        }
        
        document.body.removeChild(tempContainer);
        if (generatedImagePostCanvases.length > 0) {
            imagePostResultsHeader.classList.remove('hidden');
        }
    };

    const generateImagePosts = async () => {
        if (!imagePostBase64) {
            alert('Por favor, sube una imagen base antes de generar los posts.');
            return;
        }
        toggleImagePostLoading(true, 'Iniciando generación...');
        try {
            let titlesToGenerate: string[] = [];

            if (currentImagePostGenMode === 'ai-topic' || currentImagePostGenMode === 'ai-image') {
                const loadingMessage = currentImagePostGenMode === 'ai-image' 
                    ? 'Analizando imagen y generando títulos...' 
                    : 'Generando títulos con IA...';
                toggleImagePostLoading(true, loadingMessage);
                const generatedTitles = await generateImagePostTextsWithAI();
                titlesToGenerate = generatedTitles;
                imagePostTextsInput.value = generatedTitles.join('\n');
            } else {
                titlesToGenerate = imagePostTextsInput.value.split('\n').filter(line => line.trim() !== '');
                if (titlesToGenerate.length === 0) {
                    alert('Por favor, añade al menos un título para generar un post.');
                    toggleImagePostLoading(false);
                    return;
                }
            }
            toggleImagePostLoading(true, 'Creando imágenes de posts...');
            await generateImagePostImages(titlesToGenerate);
        } catch (error) {
            alert(`Ocurrió un error: ${(error as Error).message}`);
        } finally {
            toggleImagePostLoading(false);
        }
    };


    // --- Facebook Post Generator Logic ---
    const initFacebookPostGenerator = () => {
        const populateYears = () => {
            const currentYear = new Date().getFullYear();
            fbYearSelect.innerHTML = '<option value="any">Cualquier Año</option>';
            for (let year = currentYear; year >= 1990; year--) {
                const option = document.createElement('option');
                option.value = year.toString();
                option.textContent = year.toString();
                fbYearSelect.appendChild(option);
            }
        };

        const populateMonths = () => {
            const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            fbMonthSelect.innerHTML = '<option value="any">Cualquier Mes</option>';
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = (index + 1).toString();
                option.textContent = month;
                fbMonthSelect.appendChild(option);
            });
        };

        const populateDays = () => {
            const year = parseInt(fbYearSelect.value);
            const month = parseInt(fbMonthSelect.value);
            const currentDay = fbDaySelect.value;

            fbDaySelect.innerHTML = '<option value="any">Cualquier Día</option>';
            
            // Default to 31 days, but calculate precisely if year and month are selected
            let daysInMonth = 31;
            if (!isNaN(year) && !isNaN(month)) {
                daysInMonth = new Date(year, month, 0).getDate();
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const option = document.createElement('option');
                option.value = day.toString();
                option.textContent = day.toString();
                fbDaySelect.appendChild(option);
            }
            
            // Try to re-select the previously selected day if it's still valid
            if (parseInt(currentDay) <= daysInMonth) {
                fbDaySelect.value = currentDay;
            }
        };

        const toggleFbLoading = (isLoading: boolean) => {
            fbLoader.classList.toggle('hidden', !isLoading);
            fbGenerateBtn.disabled = isLoading;
        };
        
        const displayFbPostResults = (text: string, sources: any[]) => {
            fbInitialState.classList.add('hidden');
            fbResultsContainer.classList.remove('hidden');
            
            fbGeneratedText.textContent = text.trim();
            
            fbSourcesList.innerHTML = '';
            if (sources && sources.length > 0) {
                sources.forEach(chunk => {
                    if (chunk.web && chunk.web.uri && chunk.web.title) {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.href = chunk.web.uri;
                        a.textContent = chunk.web.title;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        li.appendChild(a);
                        fbSourcesList.appendChild(li);
                    }
                });
            } else {
                fbSourcesList.innerHTML = '<li>No se encontraron fuentes específicas.</li>';
            }
        };

        const displayFbPostError = (message: string) => {
            fbInitialState.classList.add('hidden');
            fbResultsContainer.classList.remove('hidden');
            fbGeneratedText.textContent = `Error: ${message}`;
            fbSourcesList.innerHTML = '';
        };

        const generateFacebookPost = async () => {
            if (!initializeAi()) {
                alert('Por favor, introduce tu clave API de Google AI Studio para generar el post.');
                return;
            }
            
            const personName = fbPersonNameInput.value.trim();
            if (!personName) {
                alert('Por favor, introduce el nombre de la figura pública.');
                return;
            }

            toggleFbLoading(true);

            let dateClause = "recientemente";
            if (fbYearSelect.value !== 'any') {
                if (fbMonthSelect.value !== 'any') {
                    if (fbDaySelect.value !== 'any') {
                        dateClause = `exactamente el día ${fbDaySelect.value} del mes ${fbMonthSelect.value} del año ${fbYearSelect.value}`;
                    } else {
                        dateClause = `durante el mes ${fbMonthSelect.value} del año ${fbYearSelect.value}`;
                    }
                } else {
                    dateClause = `durante el año ${fbYearSelect.value}`;
                }
            }

            let toneClause = `El tono del post debe ser ${fbToneSelect.value}.`;
            if (fbToneSelect.value === 'Automático') {
                toneClause = "Usa el tono que consideres más apropiado para la noticia encontrada.";
            }

            const prompt = `Actúa como un community manager experto en Facebook. Tu tarea es generar un borrador de post para Facebook sobre la figura pública: "${personName}".
            Utiliza la búsqueda de Google para encontrar noticias o eventos verificables sobre esta persona que ocurrieron ${dateClause}.
            ${toneClause}
            La longitud del post debe ser ${currentFbPostLength}.
            Formatea el texto con saltos de línea y emojis relevantes para que sea atractivo y fácil de leer en Facebook. No incluyas hashtags.
            Responde únicamente con el texto del post.`;

            try {
                 const response = await ai.models.generateContent({
                   model: "gemini-2.5-flash",
                   contents: prompt,
                   config: {
                     tools: [{googleSearch: {}}],
                   },
                });

                const postText = response.text;
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

                if (!postText) {
                    throw new Error("La IA no pudo generar un post con la información proporcionada. Intenta con una persona o fecha diferente.");
                }

                displayFbPostResults(postText, sources);

            } catch (error) {
                console.error("Error al generar post de Facebook:", error);
                displayFbPostError((error as Error).message.includes("API key not valid") ? "Tu clave API no es válida." : "Ocurrió un error al contactar con la IA.");
            } finally {
                toggleFbLoading(false);
            }
        };


        populateYears();
        populateMonths();
        populateDays(); // Initial population
        
        [fbYearSelect, fbMonthSelect].forEach(sel => sel.addEventListener('change', populateDays));
        fbPersonNameInput.addEventListener('input', updateFbGenerateBtnState);
        [fbYearSelect, fbMonthSelect, fbDaySelect].forEach(sel => sel.addEventListener('change', updateFbGenerateBtnState));

        fbLengthSelector.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON') {
                fbLengthSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');
                currentFbPostLength = target.dataset.length as 'corta' | 'media' | 'larga';
            }
        });
        
        fbCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(fbGeneratedText.textContent || '').then(() => {
                const originalText = fbCopyBtn.innerHTML;
                fbCopyBtn.textContent = '¡Copiado!';
                fbCopyBtn.classList.add('copied');
                setTimeout(() => {
                    fbCopyBtn.innerHTML = originalText;
                    fbCopyBtn.classList.remove('copied');
                }, 2000);
            });
        });

        fbGenerateBtn.addEventListener('click', generateFacebookPost);
    };


    // --- Meme Generator Logic ---
    const generateTextStroke = (thickness: number, color: string): string => {
        if (thickness === 0) return 'none';
        const t = `${thickness}px`;
        const shadows = [
            `-${t} -${t} 0 ${color}`, ` ${t} -${t} 0 ${color}`,
            `-${t}  ${t} 0 ${color}`, ` ${t}  ${t} 0 ${color}`,
            `-${t}   0  0 ${color}`, ` ${t}   0  0 ${color}`,
            `  0  -${t} 0 ${color}`, `  0   ${t} 0 ${color}`
        ];
        return shadows.join(', ');
    };

    const updateMemeTextStyles = () => {
        const fontFamily = memeFontSelector.value;
        const color = memeTextColorInput.value;
        const borderColor = memeBorderColorInput.value;
        const borderThickness = parseInt(memeBorderThicknessSlider.value, 10);
        const fontSize = parseInt(memeFontSizeSlider.value, 10);

        memeBorderThicknessValue.textContent = borderThickness.toString();
        memeFontSizeValue.textContent = fontSize.toString();
        const textStroke = generateTextStroke(borderThickness, borderColor);

        memeCanvasContainer.querySelectorAll('.meme-panel-text').forEach(span => {
            const s = span as HTMLDivElement;
            s.style.fontFamily = `'${fontFamily}', sans-serif`;
            s.style.color = color;
            s.style.textShadow = textStroke;
            s.style.fontSize = `${fontSize}px`;
        });
    };

    const renderMemePreview = () => {
        const layoutConfig: Record<string, { count: number, style: string }> = {
            '1f': { count: 1, style: 'grid-template-columns: 1fr; grid-template-rows: 1fr;' },
            '2v': { count: 2, style: 'grid-template-columns: 1fr; grid-template-rows: repeat(2, 1fr);' },
            '2h': { count: 2, style: 'grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr;' },
            '3v': { count: 3, style: 'grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr);' },
            '4g': { count: 4, style: 'grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);' },
            '6g': { count: 6, style: 'grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr);' },
        };

        const config = layoutConfig[currentMemeLayout];
        if (!config) return;

        // Ensure panel data array has enough items
        while (memePanelData.length < config.count) {
            memePanelData.push({ text: '', x: 50, y: 85, width: 90 });
        }
        memePanelData.length = config.count; // Truncate if needed

        memeCanvasContainer.innerHTML = '';
        memeTextInputsContainer.innerHTML = '';

        memeCanvasContainer.style.cssText = config.style;
        memeCanvasContainer.style.gap = `${memeGutterSlider.value}px`;
        memeCanvasContainer.style.backgroundColor = memeBgColorInput.value;

        for (let i = 0; i < config.count; i++) {
            const panelData = memePanelData[i];
            
            const panelDiv = document.createElement('div');
            panelDiv.className = 'meme-panel';
            panelDiv.dataset.index = i.toString();
            if (panelData.imageUrl) {
                panelDiv.style.backgroundImage = `url('${panelData.imageUrl}')`;
                panelDiv.classList.add('has-image');
            }
            
            const textWrapper = document.createElement('div');
            textWrapper.className = 'meme-text-wrapper';
            textWrapper.dataset.index = i.toString();
            textWrapper.style.left = `${panelData.x}%`;
            textWrapper.style.top = `${panelData.y}%`;
            textWrapper.style.width = `${panelData.width}%`;
            textWrapper.style.transform = 'translate(-50%, -50%)';

            const textSpan = document.createElement('div');
            textSpan.className = 'meme-panel-text';
            textSpan.textContent = panelData.text || '';
            
            const leftHandle = document.createElement('div');
            leftHandle.className = 'resize-handle left';
            const rightHandle = document.createElement('div');
            rightHandle.className = 'resize-handle right';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'meme-text-delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.title = 'Eliminar texto';
            
            textWrapper.append(leftHandle, textSpan, rightHandle, deleteBtn);
            panelDiv.appendChild(textWrapper);

            // Create text input
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.placeholder = `Texto para panel ${i + 1}...`;
            textInput.value = panelData.text || '';
            textInput.dataset.index = i.toString();

            panelDiv.addEventListener('click', (e) => {
                if(e.target === panelDiv) {
                    activeMemePanelIndex = i;
                    memeImageUpload.click();
                }
            });

            textWrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                memeCanvasContainer.querySelectorAll('.meme-text-wrapper.selected').forEach(el => el.classList.remove('selected'));
                textWrapper.classList.add('selected');
            });

            textWrapper.addEventListener('dblclick', (e) => {
                 e.stopPropagation();
                 textSpan.setAttribute('contenteditable', 'true');
                 textSpan.style.pointerEvents = 'auto';
                 textSpan.focus();
                 
                 const selection = window.getSelection();
                 const range = document.createRange();
                 range.selectNodeContents(textSpan);
                 selection?.removeAllRanges();
                 selection?.addRange(range);

                 const onBlur = () => {
                     textSpan.setAttribute('contenteditable', 'false');
                     textSpan.style.pointerEvents = 'none';
                     const newText = textSpan.textContent || '';
                     memePanelData[i].text = newText;
                     textInput.value = newText;
                     textSpan.removeEventListener('blur', onBlur);
                 }
                 textSpan.addEventListener('blur', onBlur);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                memePanelData[i].text = '';
                textSpan.textContent = '';
                textInput.value = '';
            });

            textWrapper.addEventListener('mousedown', (e) => handleTextInteractionStart(e, i, 'drag'));
            leftHandle.addEventListener('mousedown', (e) => handleTextInteractionStart(e, i, 'resize-left'));
            rightHandle.addEventListener('mousedown', (e) => handleTextInteractionStart(e, i, 'resize-right'));

            memeCanvasContainer.appendChild(panelDiv);

            textInput.addEventListener('input', () => {
                const newText = textInput.value;
                memePanelData[i].text = newText;
                textSpan.textContent = newText;
            });
            memeTextInputsContainer.appendChild(textInput);
        }
        updateMemeTextStyles();
    };

    const handleTextInteractionStart = (e: MouseEvent, index: number, type: 'drag' | 'resize-left' | 'resize-right') => {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.currentTarget as HTMLElement;
        const wrapper = type === 'drag' ? target : target.parentElement as HTMLElement;
        if (!wrapper) return;

        memeTextInteraction = {
            active: true,
            type,
            panelIndex: index,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: wrapper.offsetLeft,
            startTop: wrapper.offsetTop,
            startWidth: wrapper.offsetWidth,
        };

        document.addEventListener('mousemove', handleTextInteractionMove);
        document.addEventListener('mouseup', handleTextInteractionEnd);
    };

    const handleTextInteractionMove = (e: MouseEvent) => {
        if (!memeTextInteraction.active || memeTextInteraction.panelIndex === null) return;
        e.preventDefault();

        const { panelIndex, type, startX, startY, startLeft, startTop, startWidth } = memeTextInteraction;
        const panel = memeCanvasContainer.querySelector(`.meme-panel[data-index="${panelIndex}"]`) as HTMLElement;
        const wrapper = panel.querySelector('.meme-text-wrapper') as HTMLElement;
        if (!panel || !wrapper) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (type === 'drag') {
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            
            newLeft = Math.max(0, Math.min(newLeft, panel.offsetWidth - wrapper.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, panel.offsetHeight - wrapper.offsetHeight));
            
            wrapper.style.left = `${newLeft}px`;
            wrapper.style.top = `${newTop}px`;
            wrapper.style.transform = 'translate(0, 0)'; 
        } else {
            let newWidth;
            if (type === 'resize-right') {
                newWidth = startWidth + dx;
                newWidth = Math.max(20, Math.min(newWidth, panel.offsetWidth - wrapper.offsetLeft));
                wrapper.style.width = `${newWidth}px`;
            } else if (type === 'resize-left') {
                newWidth = startWidth - dx;
                let newLeft = startLeft + dx;

                if (newWidth < 20) { newWidth = 20; newLeft = wrapper.offsetLeft; }
                if (newLeft < 0) { newWidth += newLeft; newLeft = 0; }
                
                wrapper.style.width = `${newWidth}px`;
                wrapper.style.left = `${newLeft}px`;
            }
        }
    };
    
    const handleTextInteractionEnd = () => {
        if (!memeTextInteraction.active || memeTextInteraction.panelIndex === null) return;

        const { panelIndex } = memeTextInteraction;
        const panel = memeCanvasContainer.querySelector(`.meme-panel[data-index="${panelIndex}"]`) as HTMLElement;
        const wrapper = panel.querySelector('.meme-text-wrapper') as HTMLElement;
        
        if (panel && wrapper) {
            const panelRect = panel.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();

            const centerX = (wrapperRect.left - panelRect.left) + (wrapperRect.width / 2);
            const centerY = (wrapperRect.top - panelRect.top) + (wrapperRect.height / 2);

            memePanelData[panelIndex].x = (centerX / panelRect.width) * 100;
            memePanelData[panelIndex].y = (centerY / panelRect.height) * 100;
            memePanelData[panelIndex].width = (wrapperRect.width / panelRect.width) * 100;

            wrapper.style.left = `${memePanelData[panelIndex].x}%`;
            wrapper.style.top = `${memePanelData[panelIndex].y}%`;
            wrapper.style.width = `${memePanelData[panelIndex].width}%`;
            wrapper.style.transform = 'translate(-50%, -50%)';
        }

        memeTextInteraction = { active: false, type: null, panelIndex: null, startX: 0, startY: 0, startLeft: 0, startTop: 0, startWidth: 0 };
        document.removeEventListener('mousemove', handleTextInteractionMove);
        document.removeEventListener('mouseup', handleTextInteractionEnd);
    };


    const handleMemeImageUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    memePanelData[activeMemePanelIndex].imageUrl = e.target.result as string;
                    renderMemePreview();
                }
            };
            reader.readAsDataURL(input.files[0]);
            input.value = ''; 
        }
    };

    const updateMemeWatermark = () => {
        memeWatermarkOverlay.classList.remove('hidden');
        const opacity = memeWatermarkOpacitySlider.value;
        const size = memeWatermarkSizeSlider.value;
        memeWatermarkOverlay.style.opacity = (parseInt(opacity) / 100).toString();

        if (currentMemeWatermarkType === 'text') {
            const text = memeWatermarkTextInput.value;
            const color = memeWatermarkColorInput.value;
            if (!text) {
                memeWatermarkOverlay.classList.add('hidden');
                return;
            }
            memeWatermarkOverlay.innerHTML = `<span>${text}</span>`;
            const span = memeWatermarkOverlay.querySelector('span');
            if (span) {
                span.style.color = color;
                span.style.fontSize = `${size}px`;
            }
            memeWatermarkOverlay.style.width = 'auto';
            memeWatermarkOverlay.style.height = 'auto';
        } else {
            const imageEl = memeWatermarkOverlay.querySelector('img');
            if (!imageEl) {
                memeWatermarkOverlay.classList.add('hidden');
                return;
            }
            memeWatermarkOverlay.style.width = `${parseInt(size) * 3}px`;
            memeWatermarkOverlay.style.height = 'auto';
        }
    };

    const handleMemeWatermarkImageUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    memeWatermarkOverlay.innerHTML = `<img src="${e.target.result as string}" alt="watermark">`;
                    updateMemeWatermark();
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };
    
    const removeMemeWatermark = () => {
        memeWatermarkOverlay.classList.add('hidden');
        memeWatermarkOverlay.innerHTML = '';
        memeWatermarkTextInput.value = '';
        memeWatermarkUpload.value = '';
    };

    const startMemeWatermarkDrag = (e: MouseEvent) => {
        e.preventDefault();
        isDraggingMemeWatermark = true;
        memeWatermarkDragStartX = e.clientX;
        memeWatermarkDragStartY = e.clientY;
        memeWatermarkElementStartX = memeWatermarkOverlay.offsetLeft;
        memeWatermarkElementStartY = memeWatermarkOverlay.offsetTop;
        document.addEventListener('mousemove', doMemeWatermarkDrag);
        document.addEventListener('mouseup', stopMemeWatermarkDrag);
    };
    
    const doMemeWatermarkDrag = (e: MouseEvent) => {
        if (!isDraggingMemeWatermark) return;
        e.preventDefault();
        const dx = e.clientX - memeWatermarkDragStartX;
        const dy = e.clientY - memeWatermarkDragStartY;
        let newTop = Math.max(0, Math.min(memeWatermarkElementStartY + dy, memeCaptureWrapper.clientHeight - memeWatermarkOverlay.offsetHeight));
        let newLeft = Math.max(0, Math.min(memeWatermarkElementStartX + dx, memeCaptureWrapper.clientWidth - memeWatermarkOverlay.offsetWidth));
        memeWatermarkOverlay.style.top = `${newTop}px`;
        memeWatermarkOverlay.style.left = `${newLeft}px`;
    };
    
    const stopMemeWatermarkDrag = () => {
        isDraggingMemeWatermark = false;
        document.removeEventListener('mousemove', doMemeWatermarkDrag);
        document.removeEventListener('mouseup', stopMemeWatermarkDrag);
    };

    const generateAndDownloadMeme = async () => {
        generateMemeBtn.disabled = true;
        generateMemeBtn.textContent = 'Generando...';
        
        memeCanvasContainer.querySelectorAll('.meme-text-wrapper.selected').forEach(el => el.classList.remove('selected'));
        memeCaptureWrapper.classList.add('capturing');

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(memeCaptureWrapper, { useCORS: true, backgroundColor: memeBgColorInput.value });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `meme-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error al generar el meme:", error);
            alert("No se pudo generar la imagen del meme.");
        } finally {
            memeCaptureWrapper.classList.remove('capturing');
            generateMemeBtn.disabled = false;
            generateMemeBtn.textContent = 'Generar y Descargar';
        }
    };

    const initMemeGenerator = () => {
        memeLayoutSelector.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest('.layout-btn');
            if (button instanceof HTMLElement && button.dataset.layout) {
                currentMemeLayout = button.dataset.layout;
                memeLayoutSelector.querySelectorAll('.layout-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderMemePreview();
            }
        });

        memeGutterSlider.addEventListener('input', () => {
            memeCanvasContainer.style.gap = `${memeGutterSlider.value}px`;
            memeGutterValue.textContent = memeGutterSlider.value;
        });

        memeBgColorInput.addEventListener('input', () => {
            memeCanvasContainer.style.backgroundColor = memeBgColorInput.value;
        });

        memeFontSelector.addEventListener('change', updateMemeTextStyles);
        memeTextColorInput.addEventListener('input', updateMemeTextStyles);
        memeBorderColorInput.addEventListener('input', updateMemeTextStyles);
        memeBorderThicknessSlider.addEventListener('input', updateMemeTextStyles);
        memeFontSizeSlider.addEventListener('input', updateMemeTextStyles);

        memeImageUpload.addEventListener('change', handleMemeImageUpload);
        generateMemeBtn.addEventListener('click', generateAndDownloadMeme);

        // Watermark Listeners
        memeWatermarkTextTab.addEventListener('click', () => {
            currentMemeWatermarkType = 'text';
            memeWatermarkTextTab.classList.add('active');
            memeWatermarkImageTab.classList.remove('active');
            memeWatermarkTextOptions.classList.remove('hidden');
            memeWatermarkImageOptions.classList.add('hidden');
            const sizeLabel = document.querySelector('#meme-generator-view .watermark-slider label[for="meme-watermark-size"]') as HTMLLabelElement;
            if (sizeLabel) sizeLabel.textContent = 'Tamaño:';
            updateMemeWatermark();
        });
        memeWatermarkImageTab.addEventListener('click', () => {
            currentMemeWatermarkType = 'image';
            memeWatermarkImageTab.classList.add('active');
            memeWatermarkTextTab.classList.remove('active');
            memeWatermarkImageOptions.classList.remove('hidden');
            memeWatermarkTextOptions.classList.add('hidden');
            const sizeLabel = document.querySelector('#meme-generator-view .watermark-slider label[for="meme-watermark-size"]') as HTMLLabelElement;
            if(sizeLabel) sizeLabel.textContent = 'Ancho:';
            updateMemeWatermark();
        });
        memeWatermarkTextInput.addEventListener('input', updateMemeWatermark);
        memeWatermarkColorInput.addEventListener('input', updateMemeWatermark);
        memeWatermarkSizeSlider.addEventListener('input', updateMemeWatermark);
        memeWatermarkOpacitySlider.addEventListener('input', updateMemeWatermark);
        memeWatermarkUpload.addEventListener('change', handleMemeWatermarkImageUpload);
        memeRemoveWatermarkBtn.addEventListener('click', removeMemeWatermark);
        memeWatermarkOverlay.addEventListener('mousedown', startMemeWatermarkDrag);
        
        // Deselect text when clicking outside
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.meme-text-wrapper') && !target.closest('#meme-text-inputs-container') && !target.closest('.meme-controls')) {
                 memeCanvasContainer.querySelectorAll('.meme-text-wrapper.selected').forEach(el => el.classList.remove('selected'));
            }
        });

        // Initial render
        (memeLayoutSelector.querySelector(`[data-layout="${currentMemeLayout}"]`) as HTMLElement)?.classList.add('active');
        renderMemePreview();
    };

    // --- Event Listeners ---
    apiKeyInput.addEventListener('change', initializeAi);
    tabChatGenerator.addEventListener('click', () => setActiveTab('chat'));
    tabPostGenerator.addEventListener('click', () => setActiveTab('post'));
    tabImagePostGenerator.addEventListener('click', () => setActiveTab('image-post'));
    tabFacebookPostGenerator.addEventListener('click', () => setActiveTab('facebook-post'));
    tabMemeGenerator.addEventListener('click', () => setActiveTab('meme'));


    // Chat listeners
    form.addEventListener('submit', generateChat);
    downloadFullBtn.addEventListener('click', () => downloadChatScreenshot(chatWindow, `captura-completa-${Date.now()}.png`));
    downloadChatOnlyBtn.addEventListener('click', () => downloadChatScreenshot(chatMessagesContainer, `solo-chat-${Date.now()}.png`));
    backgroundUpload.addEventListener('change', handleBackgroundChange);
    changeApiKeyBtn.addEventListener('click', () => { 
        localStorage.removeItem('gemini-api-key'); 
        initApiKeyUI(); 
    });
    imageUploadInput.addEventListener('change', (event) => { const input = event.target as HTMLInputElement; if (input.files && input.files[0] && imageUploadTarget.sender && imageUploadTarget.index !== null) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) { const newMessage: Message = { sender: imageUploadTarget.sender!, imageUrl: e.target.result as string, isSticker: imageUploadTarget.isSticker || false, timestamp: getCurrentTimestamp(), status: imageUploadTarget.sender === 'Persona 2' ? 'delivered' : undefined }; currentConversation.splice(imageUploadTarget.index!, 0, newMessage); displayMessages(); } imageUploadTarget = { sender: null, index: null, isSticker: false }; input.value = ''; }; reader.readAsDataURL(input.files[0]); } });
    profilePicContainer.addEventListener('click', () => profilePicUpload.click());
    profilePicUpload.addEventListener('change', (event: Event) => { const input = event.target as HTMLInputElement; if (input.files && input.files[0]) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) { profilePicImg.src = e.target.result as string; if(defaultProfileIcon) defaultProfileIcon.style.display = 'none'; } }; reader.readAsDataURL(input.files[0]); } });
    contactNameSpan.addEventListener('click', () => makeEditable(contactNameSpan));
    contactStatusSpan.addEventListener('click', () => makeEditable(contactStatusSpan));
    watermarkTextTab.addEventListener('click', () => { currentWatermarkType = 'text'; watermarkTextTab.classList.add('active'); watermarkImageTab.classList.remove('active'); watermarkTextOptions.classList.remove('hidden'); watermarkImageOptions.classList.add('hidden'); const sizeLabel = document.querySelector('.watermark-slider label[for="watermark-size"]') as HTMLLabelElement; if(sizeLabel) sizeLabel.textContent = 'Tamaño:'; updateWatermark(); });
    watermarkImageTab.addEventListener('click', () => { currentWatermarkType = 'image'; watermarkImageTab.classList.add('active'); watermarkTextTab.classList.remove('active'); watermarkImageOptions.classList.remove('hidden'); watermarkTextOptions.classList.add('hidden'); const sizeLabel = document.querySelector('.watermark-slider label[for="watermark-size"]') as HTMLLabelElement; if(sizeLabel) sizeLabel.textContent = 'Ancho:'; updateWatermark(); });
    watermarkTextInput.addEventListener('input', updateWatermark);
    watermarkColorInput.addEventListener('input', updateWatermark);
    watermarkSizeSlider.addEventListener('input', updateWatermark);
    watermarkOpacitySlider.addEventListener('input', updateWatermark);
    watermarkUpload.addEventListener('change', handleWatermarkImageUpload);
    removeWatermarkBtn.addEventListener('click', removeWatermark);
    watermarkOverlay.addEventListener('mousedown', startWatermarkDrag);

    // Post (Text) listeners
    templateBtnFacebook.addEventListener('click', () => setActiveTemplate('facebook'));
    templateBtnTwitter.addEventListener('click', () => setActiveTemplate('twitter'));
    textAlignSelector.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.align-btn');
        if (target instanceof HTMLElement && target.dataset.align) {
            const align = target.dataset.align;
            textAlignSelector.querySelectorAll('.align-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            postTextP.classList.remove('align-left', 'align-center', 'align-right', 'align-justify');
            postTextP.classList.add(`align-${align}`);
        }
    });
    toggleVerifiedBadgeTwitter.addEventListener('change', updateVerifiedBadgeVisibility);
    toggleVerifiedBadgeFacebook.addEventListener('change', updateVerifiedBadgeVisibility);
    postProfilePicDiv.addEventListener('click', () => postProfilePicUpload.click());
    postProfilePicUpload.addEventListener('change', handlePostProfilePicUpload);
    postNameSpan.addEventListener('click', () => makeEditable(postNameSpan, savePostTemplateData));
    postUsernameSpan.addEventListener('click', () => makeEditable(postUsernameSpan, savePostTemplateData));
    generatePostsBtn.addEventListener('click', generatePosts);
    downloadAllZipBtn.addEventListener('click', () => downloadAllAsZip(generatedPostCanvases, 'generated_posts.zip'));
    modeManualBtn.addEventListener('click', () => switchPostGenMode('manual'));
    modeAiBtn.addEventListener('click', () => switchPostGenMode('ai'));

    // Image Post listeners
    imagePostBaseUpload.addEventListener('change', handleImageBaseUpload);
    toggleImagePostHeader.addEventListener('change', () => {
        const showHeader = toggleImagePostHeader.checked;
        imagePostHeaderOptions.classList.toggle('hidden', !showHeader);
        imagePostPreviewHeader.classList.toggle('hidden', !showHeader);
    });
    const setActiveImagePostTemplate = (templateName: 'facebook' | 'twitter') => {
        const preview = imagePostPreviewTemplate;
        preview.className = `post-template ${templateName}`;
        imagePostTemplateBtnFacebook.classList.toggle('active', templateName === 'facebook');
        imagePostTemplateBtnTwitter.classList.toggle('active', templateName !== 'facebook');
        imagePostFacebookOptions.classList.toggle('hidden', templateName !== 'facebook');
        imagePostTwitterOptions.classList.toggle('hidden', templateName === 'facebook');
        
        const showVerified = templateName === 'facebook' ? toggleImagePostVerifiedFacebook.checked : toggleImagePostVerifiedTwitter.checked;
        preview.classList.toggle('show-verified', showVerified);
    };
    imagePostTemplateBtnFacebook.addEventListener('click', () => setActiveImagePostTemplate('facebook'));
    imagePostTemplateBtnTwitter.addEventListener('click', () => setActiveImagePostTemplate('twitter'));
    toggleImagePostVerifiedFacebook.addEventListener('change', () => setActiveImagePostTemplate('facebook'));
    toggleImagePostVerifiedTwitter.addEventListener('change', () => setActiveImagePostTemplate('twitter'));
    imagePostFontSelector.addEventListener('change', (e) => {
        const selectedFont = (e.target as HTMLSelectElement).value;
        imagePostPreviewTitle.style.fontFamily = `'${selectedFont}', sans-serif`;
    });
    imagePostStyleSelector.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.style-btn');
        if (target instanceof HTMLElement && target.dataset.style) {
            const style = target.dataset.style;
            target.classList.toggle('active');
            imagePostPreviewTitle.classList.toggle(`font-${style}`);
        }
    });
    imagePostTextAlignSelector.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.align-btn');
        if (target instanceof HTMLElement && target.dataset.align) {
            const align = target.dataset.align;
            imagePostTextAlignSelector.querySelectorAll('.align-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            imagePostPreviewTitle.classList.remove('align-left', 'align-center', 'align-right', 'align-justify');
            imagePostPreviewTitle.classList.add(`align-${align}`);
        }
    });
    imagePostWatermarkTextTab.addEventListener('click', () => {
        currentImagePostWatermarkType = 'text';
        imagePostWatermarkTextTab.classList.add('active');
        imagePostWatermarkImageTab.classList.remove('active');
        imagePostWatermarkTextOptions.classList.remove('hidden');
        imagePostWatermarkImageOptions.classList.add('hidden');
        const sizeLabel = document.querySelector('#image-post-generator-view .watermark-slider label[for="image-post-watermark-size"]') as HTMLLabelElement;
        if (sizeLabel) sizeLabel.textContent = 'Tamaño:';
        updateImagePostWatermark();
    });
    imagePostWatermarkImageTab.addEventListener('click', () => {
        currentImagePostWatermarkType = 'image';
        imagePostWatermarkImageTab.classList.add('active');
        imagePostWatermarkTextTab.classList.remove('active');
        imagePostWatermarkImageOptions.classList.remove('hidden');
        imagePostWatermarkTextOptions.classList.add('hidden');
        const sizeLabel = document.querySelector('#image-post-generator-view .watermark-slider label[for="image-post-watermark-size"]') as HTMLLabelElement;
        if(sizeLabel) sizeLabel.textContent = 'Ancho:';
        updateImagePostWatermark();
    });
    imagePostWatermarkTextInput.addEventListener('input', updateImagePostWatermark);
    imagePostWatermarkColorInput.addEventListener('input', updateImagePostWatermark);
    imagePostWatermarkSizeSlider.addEventListener('input', updateImagePostWatermark);
    imagePostWatermarkOpacitySlider.addEventListener('input', updateImagePostWatermark);
    imagePostWatermarkUpload.addEventListener('change', handleImagePostWatermarkImageUpload);
    imagePostRemoveWatermarkBtn.addEventListener('click', removeImagePostWatermark);
    imagePostWatermarkOverlay.addEventListener('mousedown', startImagePostWatermarkDrag);
    imagePostModeManualBtn.addEventListener('click', () => switchImagePostGenMode('manual'));
    imagePostModeAiTopicBtn.addEventListener('click', () => switchImagePostGenMode('ai-topic'));
    imagePostModeAiImageBtn.addEventListener('click', () => switchImagePostGenMode('ai-image'));
    generateImagePostsBtn.addEventListener('click', generateImagePosts);
    imagePostDownloadAllZipBtn.addEventListener('click', () => downloadAllAsZip(generatedImagePostCanvases, 'generated_image_posts.zip'));
    imagePostTextsInput.addEventListener('input', () => {
        const firstLine = imagePostTextsInput.value.split('\n')[0];
        imagePostPreviewTitle.textContent = firstLine || 'Este es el título que aparecerá sobre tu imagen...';
    });
    
    // --- Initial setup ---
    initApiKeyUI();
    displayMessages();
    setActiveTab('chat'); // Start on chat tab
    loadPostTemplateData();
    setActiveTemplate('facebook');
    switchPostGenMode('manual');
    switchImagePostGenMode('manual');
    setActiveImagePostTemplate('facebook');
    initFacebookPostGenerator();
    initMemeGenerator();
    // Set initial font and alignment for image post preview
    imagePostFontSelector.value = 'Roboto';
    imagePostPreviewTitle.style.fontFamily = 'Roboto, sans-serif';
    imagePostPreviewTitle.classList.add('align-left');
    imagePostTextAlignSelector.querySelector('.align-btn[data-align="left"]')?.classList.add('active');
};

App();
