import { Type } from "@google/genai";
import { getAiInstance } from '../services/api.js';
import { createWatermarkManager } from "../utils/watermark.js";
import { makeEditable } from "../utils/ui.js";
import { downloadAllAsZip } from "../utils/helpers.js";

export const initImagePostGenerator = () => {
    // --- Elements ---
    const view = document.getElementById('image-post-generator-view');
    const baseUpload = document.getElementById('image-post-base-upload');
    const thumbnailContainer = document.getElementById('image-post-thumbnail-container');
    const thumbnail = document.getElementById('image-post-thumbnail');
    const previewContainer = document.getElementById('image-post-preview-container');
    const previewTemplate = document.getElementById('image-post-preview-template');
    const baseImgPreview = previewTemplate.querySelector('.image-post-base-img');
    const previewTitle = previewTemplate.querySelector('.image-post-title');
    const generateBtn = document.getElementById('generate-image-posts-btn');
    const loader = document.getElementById('image-post-generator-loader');
    const loaderText = loader.querySelector('p');

    // Header elements
    const toggleHeaderCheckbox = document.getElementById('toggle-image-post-header');
    const headerOptions = document.getElementById('image-post-header-options');
    const headerEl = previewTemplate.querySelector('.post-header');
    const templateBtnFacebook = document.getElementById('image-post-template-btn-facebook');
    const templateBtnTwitter = document.getElementById('image-post-template-btn-twitter');
    const fbOptions = document.getElementById('image-post-facebook-options');
    const twOptions = document.getElementById('image-post-twitter-options');
    const fbVerifiedCheck = document.getElementById('toggle-image-post-verified-facebook');
    const twVerifiedCheck = document.getElementById('toggle-image-post-verified-twitter');
    const profilePicDiv = headerEl.querySelector('.post-profile-pic');
    const profilePicUpload = document.getElementById('image-post-profile-pic-upload');
    const profilePicImg = headerEl.querySelector('.post-profile-pic img');
    const nameSpan = headerEl.querySelector('.post-name');
    const usernameSpan = headerEl.querySelector('.post-username');

    // Text customization elements
    const fontSelector = document.getElementById('image-post-font-selector');
    const styleSelector = document.getElementById('image-post-style-selector');
    const alignSelector = document.getElementById('image-post-text-align-selector');

    // Title mode elements
    const modeManualBtn = document.getElementById('image-post-mode-manual-btn');
    const modeAiTopicBtn = document.getElementById('image-post-mode-ai-topic-btn');
    const modeAiImageBtn = document.getElementById('image-post-mode-ai-image-btn');
    const manualInputContainer = document.getElementById('image-post-manual-input-container');
    const textsInput = document.getElementById('image-post-texts-input');
    const aiInputContainer = document.getElementById('image-post-ai-input-container');
    const aiTopicGroup = document.getElementById('image-post-ai-topic-group');
    const aiTopicInput = document.getElementById('image-post-ai-topic');
    const aiToneSelect = document.getElementById('image-post-ai-tone');
    const aiQuantityInput = document.getElementById('image-post-ai-quantity');

    // Results elements
    const resultsArea = document.getElementById('image-post-results-area');
    const resultsHeader = resultsArea.querySelector('.results-header');
    const resultsGrid = document.getElementById('image-post-results-grid');
    const downloadAllBtn = document.getElementById('image-post-download-all-zip-btn');

    // --- State ---
    let currentBaseImage = null; // Store base64 of the uploaded image
    let generatedPostCanvases = [];
    let currentTitleMode = 'manual';

    const titlesSchema = {
        type: Type.OBJECT,
        properties: {
            titles: {
                type: Type.ARRAY,
                description: "Una lista de los títulos generados para las publicaciones.",
                items: {
                    type: Type.STRING,
                    description: "El texto de un solo título."
                }
            }
        },
        required: ["titles"]
    };

    // --- Watermark ---
    const watermarkManager = createWatermarkManager({
        textTabEl: document.getElementById('image-post-watermark-text-tab'),
        imageTabEl: document.getElementById('image-post-watermark-image-tab'),
        textOptionsEl: document.getElementById('image-post-watermark-text-options'),
        imageOptionsEl: document.getElementById('image-post-watermark-image-options'),
        textInputEl: document.getElementById('image-post-watermark-text'),
        colorInputEl: document.getElementById('image-post-watermark-color'),
        imageUploadEl: document.getElementById('image-post-watermark-upload'),
        sizeSliderEl: document.getElementById('image-post-watermark-size'),
        opacitySliderEl: document.getElementById('image-post-watermark-opacity'),
        removeBtnEl: document.getElementById('image-post-remove-watermark-btn'),
        overlayEl: document.getElementById('image-post-watermark-overlay'),
        containerEl: previewContainer,
        sizeLabelText: "Tamaño:",
        sizeLabelImage: "Ancho:",
        sizeLabelSelector: '#image-post-generator-view .watermark-slider label[for="image-post-watermark-size"]'
    });
    watermarkManager.init();
    
    // --- Functions ---
    const getToneInstruction = (toneKey) => {
        const toneMap = {
            'sarcastic_humorous': 'Actúa como un copywriter profesional con un humor ácido. Tu objetivo es hacer reír mientras te burlas de una realidad absurda. Usa frases como "Claro...", "Obvio...", exageraciones y dobles sentidos para crear memes o desahogos cotidianos virales.',
            'polemic_opinative': 'Actúa como un creador de contenido que busca generar debate. Tu objetivo es dividir opiniones en los comentarios. Usa absolutos como "siempre", "nunca", comparaciones y juicios directos sobre temas sociales o de relaciones.',
            'ironic_critical': 'Actúa como un crítico social con un tono de sarcasmo elegante. Tu objetivo es denunciar o señalar una situación con ironía. Usa contradicciones y un tono seco para hablar de actitudes tóxicas o problemas sociales.',
            'emotional_reflective': 'Actúa como un escritor de contenido emocional. Tu objetivo es crear una identificación profunda que motive a compartir. Usa frases introspectivas que empiecen con "A veces...", "Lo peor es..." para conectar a un nivel sentimental.',
            'curious_emotional': 'Actúa como un storyteller experto en ganchos virales. Tu objetivo es atraer la atención desde el misterio y cerrar con una conexión emocional. Usa preguntas o frases incompletas para generar curiosidad y finaliza con una revelación sentimental.',
            'inspiring_critical': 'Actúa como un coach motivacional que no teme ser directo. Tu objetivo es empoderar al lector mientras cuestionas una mentalidad negativa. Usa imperativos, frases fuertes y reflexiones que inviten a la acción y al auto-respeto.',
            'sarcastic_polemic': 'Actúa como un creador de contenido provocador. Tu objetivo es generar reacciones fuertes usando un tono burlón. Combina el sarcasmo y la ironía con frases polémicas que expongan dobles estándares o hipocresías.',
            'double_meaning_humor': 'Actúa como un comediante de humor adulto. Tu objetivo es generar risa e interacción a través de insinuaciones. Usa frases ambiguas y juegos de palabras que tengan una doble lectura.',
            'curious_polemic': 'Actúa como un generador de debates virales. Tu objetivo es captar la atención desde la duda y cerrar con una opinión tajante. Usa frases como "Nadie dice esto..." o "La verdad es..." para introducir un tema y luego presenta una conclusión polémica.',
            'dramatic_emotional': 'Actúa como un narrador de historias con alto impacto sentimental. Tu objetivo es generar compartidos a través de la emoción pura. Usa palabras intensas y frases profundas para describir situaciones dramáticas o desamores.',
            'pure_sarcastic': 'Adopta un tono puramente sarcástico. Tu objetivo es burlarte de algo absurdo con inteligencia. Usa palabras como "Obvio", "Claro..." y expón contradicciones de forma evidente.',
            'pure_polemic': 'Adopta un tono puramente polémico. Tu objetivo es dividir opiniones de forma directa. Usa absolutos, juicios y frases tajantes sin ambigüedad.',
            'pure_humorous': 'Adopta un tono puramente humorístico. Tu objetivo es hacer reír o entretener de forma ligera. Usa juegos de palabras, exageraciones y observaciones graciosas de lo cotidiano.',
            'pure_ironic': 'Adopta un tono puramente irónico. Tu objetivo es señalar lo absurdo diciendo exactamente lo contrario. Usa un sarcasmo elegante y críticas indirectas.',
            'pure_curious': 'Adopta un tono puramente curioso. Tu objetivo es despertar el interés y crear un gancho (hook). Usa preguntas y frases incompletas que dejen al lector queriendo saber más.',
            'pure_emotional': 'Adopta un tono puramente emocional. Tu objetivo es crear una conexión profunda y sentimental. Usa frases que exploren sentimientos universales como el dolor, el amor o la soledad.',
            'pure_critical': 'Adopta un tono puramente crítico. Tu objetivo es exponer una opinión fuerte y directa. Usa frases tajantes, juicios y declaraciones firmes sobre un tema.',
            'pure_motivational': 'Adopta un tono puramente motivacional. Tu objetivo es inspirar y empoderar al lector. Usa imperativos, frases de aliento y llamados a la acción.',
            'pure_double_meaning': 'Adopta un tono puramente de doble sentido. Tu objetivo es jugar con la ambigüedad para conectar de forma pícara. Usa insinuaciones y frases con doble lectura.',
            'pure_dramatic': 'Adopta un tono puramente dramático. Tu objetivo es impactar emocionalmente. Usa un lenguaje intenso, profundo y con carga sentimental para describir una situación.'
        };
        return toneMap[toneKey] || 'Actúa como un copywriter experto en redes sociales. Escribe en un tono neutro e informativo.';
    };

    const saveProfileData = () => {
        const data = {
            profilePic: profilePicImg.src,
            name: nameSpan.textContent,
            username: usernameSpan.textContent
        };
        localStorage.setItem('postGeneratorTemplateData', JSON.stringify(data));
    };

    const loadProfileData = () => {
        const savedData = localStorage.getItem('postGeneratorTemplateData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.profilePic) profilePicImg.src = data.profilePic;
                if (data.name) nameSpan.textContent = data.name;
                if (data.username) usernameSpan.textContent = data.username;
            } catch (e) {
                console.error("Error al cargar datos de perfil:", e);
            }
        }
    };

    const handleBaseImageUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentBaseImage = ev.target.result;
            thumbnail.src = currentBaseImage;
            baseImgPreview.src = currentBaseImage;
            thumbnailContainer.classList.remove('hidden');
            modeAiImageBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    };

    const updateVerifiedBadgeVisibility = () => {
        const isFacebook = previewTemplate.classList.contains('facebook');
        previewTemplate.classList.toggle('show-verified', isFacebook ? fbVerifiedCheck.checked : twVerifiedCheck.checked);
    };
    
    const setActiveTemplate = (templateName) => {
        const isFacebook = templateName === 'facebook';
        templateBtnFacebook.classList.toggle('active', isFacebook);
        templateBtnTwitter.classList.toggle('active', !isFacebook);
        previewTemplate.classList.toggle('facebook', isFacebook);
        previewTemplate.classList.toggle('twitter', !isFacebook);
        fbOptions.classList.toggle('hidden', !isFacebook);
        twOptions.classList.toggle('hidden', isFacebook);
        updateVerifiedBadgeVisibility();
    };

    const updateTitleFont = () => {
        previewTitle.style.fontFamily = `'${fontSelector.value}', sans-serif`;
    };
    
    const switchTitleMode = (mode) => {
        currentTitleMode = mode;
        [modeManualBtn, modeAiTopicBtn, modeAiImageBtn].forEach(btn => btn.classList.remove('active'));
        manualInputContainer.classList.add('hidden');
        aiInputContainer.classList.add('hidden');
        aiTopicGroup.style.display = 'block';

        switch(mode) {
            case 'ai-topic':
                modeAiTopicBtn.classList.add('active');
                aiInputContainer.classList.remove('hidden');
                generateBtn.textContent = 'Generar Títulos y Posts';
                break;
            case 'ai-image':
                modeAiImageBtn.classList.add('active');
                aiInputContainer.classList.remove('hidden');
                aiTopicGroup.style.display = 'none'; // Hide topic input when using image
                generateBtn.textContent = 'Sugerir Títulos y Generar Posts';
                break;
            case 'manual':
            default:
                modeManualBtn.classList.add('active');
                manualInputContainer.classList.remove('hidden');
                generateBtn.textContent = 'Generar Posts con Imagen';
                break;
        }
    };
    
    const toggleLoading = (isLoading, message = 'Generando imágenes...') => {
        loaderText.textContent = message;
        loader.classList.toggle('hidden', !isLoading);
        generateBtn.disabled = isLoading;
    };

    const generateTitlesWithAI = async () => {
        const ai = getAiInstance();
        if (!ai) throw new Error('Por favor, introduce tu clave API para usar la generación con IA.');

        const toneKey = aiToneSelect.value;
        const copywriterPersona = getToneInstruction(toneKey);
        const quantity = aiQuantityInput.value;
        let contents;

        if (currentTitleMode === 'ai-image') {
            if (!currentBaseImage) {
                throw new Error('No se ha subido ninguna imagen para analizar.');
            }
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: currentBaseImage.split(',')[1] } };
            const textPart = { text: `Tu rol es el de: ${copywriterPersona}. Tu misión es crear ${quantity} títulos cortos, creativos y llamativos para la imagen proporcionada. El resultado debe ser un objeto JSON que siga el esquema proporcionado, sin explicaciones adicionales.` };
            contents = { parts: [imagePart, textPart] };

        } else if (currentTitleMode === 'ai-topic') {
            const topic = aiTopicInput.value.trim();
            if (!topic) {
                throw new Error('Por favor, introduce un tema principal para la generación de títulos.');
            }
            contents = `Tu rol es el de: ${copywriterPersona}. Tu misión es crear ${quantity} títulos cortos, creativos y llamativos para publicaciones en redes sociales sobre el siguiente tema: "${topic}". El resultado debe ser un objeto JSON que siga el esquema proporcionado, sin explicaciones adicionales.`;
        
        } else {
             throw new Error(`Modo de generación AI no reconocido: ${currentTitleMode}`);
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: { responseMimeType: "application/json", responseSchema: titlesSchema }
        });

        const parsedJson = JSON.parse(response.text.trim());
        if (parsedJson.titles && parsedJson.titles.length > 0) {
            return parsedJson.titles;
        } else {
            throw new Error("La IA no devolvió ningún título.");
        }
    };

    const generateImages = async (titles) => {
        resultsGrid.innerHTML = '';
        resultsHeader.classList.add('hidden');
        generatedPostCanvases = [];
        
        for (const [index, title] of titles.entries()) {
            previewTitle.textContent = title;
            try {
                const canvas = await html2canvas(previewTemplate, { useCORS: true, backgroundColor: '#ffffff' });
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
                    link.download = `post_imagen_${index + 1}.png`;
                    link.click();
                };
                
                resultItem.appendChild(img);
                resultItem.appendChild(downloadBtn);
                resultsGrid.appendChild(resultItem);
            } catch (error) {
                console.error(`Error al generar imagen para el título ${index + 1}:`, error);
            }
        }

        if (generatedPostCanvases.length > 0) {
            resultsHeader.classList.remove('hidden');
        }
    };

    const generatePosts = async () => {
        if (!currentBaseImage) {
            alert('Por favor, sube una imagen base primero.');
            return;
        }

        toggleLoading(true, 'Iniciando generación...');
        try {
            let titlesToGenerate = [];

            if (currentTitleMode.startsWith('ai')) {
                toggleLoading(true, 'Generando títulos con IA...');
                titlesToGenerate = await generateTitlesWithAI();
            } else {
                titlesToGenerate = textsInput.value.split('\n').filter(text => text.trim() !== '');
            }

            if (titlesToGenerate.length === 0) {
                alert('No hay títulos para generar. Por favor, escribe o genera títulos primero.');
                return;
            }

            toggleLoading(true, `Generando ${titlesToGenerate.length} imágenes...`);
            await generateImages(titlesToGenerate);

        } catch (error) {
            console.error("Error al generar posts con imagen:", error);
            alert(`Error: ${error.message}`);
        } finally {
            toggleLoading(false);
        }
    };
    
    // --- Event Listeners ---
    baseUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) handleBaseImageUpload(e.target.files[0]);
    });

    view.addEventListener('paste', e => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if(blob) handleBaseImageUpload(blob);
                e.preventDefault();
                break;
            }
        }
    });

    // Header controls
    toggleHeaderCheckbox.addEventListener('change', () => {
        headerEl.classList.toggle('hidden', !toggleHeaderCheckbox.checked);
        headerOptions.classList.toggle('hidden', !toggleHeaderCheckbox.checked);
    });
    templateBtnFacebook.addEventListener('click', () => setActiveTemplate('facebook'));
    templateBtnTwitter.addEventListener('click', () => setActiveTemplate('twitter'));
    fbVerifiedCheck.addEventListener('change', updateVerifiedBadgeVisibility);
    twVerifiedCheck.addEventListener('change', updateVerifiedBadgeVisibility);
    profilePicDiv.addEventListener('click', () => profilePicUpload.click());
    profilePicUpload.addEventListener('change', (e) => {
         if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => { 
                if(ev.target.result) {
                    profilePicImg.src = ev.target.result;
                    saveProfileData();
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    nameSpan.addEventListener('click', () => makeEditable(nameSpan, saveProfileData));
    usernameSpan.addEventListener('click', () => makeEditable(usernameSpan, saveProfileData));
    
    // Text controls
    fontSelector.addEventListener('change', updateTitleFont);

    styleSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-btn');
        if (!btn) return;
        btn.classList.toggle('active');
        previewTitle.classList.toggle(`font-${btn.dataset.style}`);
    });

    alignSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.align-btn');
        if (!btn) return;
        alignSelector.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        previewTitle.classList.remove('align-left', 'align-center', 'align-right', 'align-justify');
        previewTitle.classList.add(`align-${btn.dataset.align}`);
    });
    
    // Mode controls
    modeManualBtn.addEventListener('click', () => switchTitleMode('manual'));
    modeAiTopicBtn.addEventListener('click', () => switchTitleMode('ai-topic'));
    modeAiImageBtn.addEventListener('click', () => switchTitleMode('ai-image'));

    generateBtn.addEventListener('click', generatePosts);
    downloadAllBtn.addEventListener('click', () => downloadAllAsZip(generatedPostCanvases, 'image-posts'));

    // --- Init ---
    loadProfileData();
    setActiveTemplate('facebook');
    updateTitleFont();
    switchTitleMode('manual');
    // Set initial alignment
    alignSelector.querySelector('.align-btn').classList.add('active');
    previewTitle.classList.add('align-left');
};