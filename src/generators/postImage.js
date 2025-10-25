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
    const modeAiTrendBtn = document.getElementById('image-post-mode-ai-trend-btn');
    const manualInputContainer = document.getElementById('image-post-manual-input-container');
    const textsInput = document.getElementById('image-post-texts-input');
    const aiInputContainer = document.getElementById('image-post-ai-input-container');
    const aiTopicGroup = document.getElementById('image-post-ai-topic-group');
    const aiTopicInput = document.getElementById('image-post-ai-topic');
    const aiTrendGroup = document.getElementById('image-post-ai-trend-group');
    const aiTrendTopicInput = document.getElementById('image-post-ai-trend-topic');
    const aiTrendDateFilter = document.getElementById('image-post-ai-trend-date-filter');
    const contentTypeSelector = document.getElementById('image-post-content-type-selector');
    const aiToneSelect = document.getElementById('image-post-ai-tone');
    const aiReactionSelect = document.getElementById('image-post-ai-reaction');
    const aiLengthSelector = document.getElementById('image-post-ai-length-selector');
    const aiQuantityInput = document.getElementById('image-post-ai-quantity');

    // Results elements
    const resultsArea = document.getElementById('image-post-results-area');
    const resultsHeader = resultsArea.querySelector('.results-header');
    const resultsGrid = document.getElementById('image-post-results-grid');
    const downloadAllBtn = document.getElementById('image-post-download-all-zip-btn');

    // --- State ---
    let currentBaseImage = null; // Store base64 of the uploaded image
    let currentTitleMode = 'manual';
    let currentAiLength = 'medio';

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
        const baseInstruction = " Usa siempre un lenguaje natural, coloquial y fácil de entender, como el español que se habla en México. Evita palabras demasiado formales o rebuscadas.";
        const toneMap = {
            'sarcastic_humorous': 'Actúa como un copywriter profesional con un humor ácido. Tu objetivo es hacer reír mientras te burlas de una realidad absurda. Usa frases como "Claro...", "Obvio...", exageraciones y dobles sentidos para crear memes o desahogos cotidianos virales.' + baseInstruction,
            'polemic_opinative': 'Actúa como un creador de contenido que busca generar debate. Tu objetivo es dividir opiniones en los comentarios. Usa absolutos como "siempre", "nunca", comparaciones y juicios directos sobre temas sociales o de relaciones.' + baseInstruction,
            'ironic_critical': 'Actúa como un crítico social con un tono de sarcasmo elegante. Tu objetivo es denunciar o señalar una situación con ironía. Usa contradicciones y un tono seco para hablar de actitudes tóxicas o problemas sociais.' + baseInstruction,
            'emotional_reflective': 'Actúa como un escritor de contenido emocional. Tu objetivo es crear una identificación profunda que motive a compartir. Usa frases introspectivas que empiecen con "A veces...", "Lo peor es..." para conectar a un nivel sentimental.' + baseInstruction,
            'curious_emotional': 'Actúa como un storyteller experto en ganchos virales. Tu objetivo es atraer la atención desde el misterio y cerrar con una conexión emocional. Usa preguntas o frases incompletas para generar curiosidad y finaliza con una revelación sentimental.' + baseInstruction,
            'inspiring_critical': 'Actúa como un coach motivacional que no teme ser directo. Tu objetivo es empoderar al lector mientras cuestionas una mentalidad negativa. Usa imperativos, frases fuertes y reflexiones que inviten a la acción y al auto-respeto.' + baseInstruction,
            'sarcastic_polemic': 'Actúa como un creador de contenido provocador. Tu objetivo es generar reacciones fuertes usando un tono burlón. Combina el sarcasmo y la ironía con frases polémicas que expongan dobles estándares o hipocresías.' + baseInstruction,
            'double_meaning_humor': 'Actúa como un comediante de humor adulto. Tu objetivo es generar risa e interacción a través de insinuaciones. Usa frases ambiguas y juegos de palabras que tengan una doble lectura.' + baseInstruction,
            'curious_polemic': 'Actúa como un generador de debates virales. Tu objetivo es captar la atención desde la duda y cerrar con una opinión tajante. Usa frases como "Nadie dice esto..." o "La verdad es..." para introducir un tema y luego presenta una conclusión polémica.' + baseInstruction,
            'dramatic_emotional': 'Actúa como un narrador de historias con alto impacto sentimental. Tu objetivo es generar compartidos a través de la emoción pura. Usa palabras intensas y frases profundas para describir situaciones dramáticas o desamores.' + baseInstruction,
            'pure_sarcastic': 'Adopta un tono puramente sarcástico. Tu objetivo es burlarte de algo absurdo con inteligencia. Usa palabras como "Obvio", "Claro..." y expón contradicciones de forma evidente.' + baseInstruction,
            'pure_polemic': 'Adopta un tono puramente polémico. Tu objetivo es dividir opiniones de forma directa. Usa absolutos, juicios y frases tajantes sin ambigüedad.' + baseInstruction,
            'pure_humorous': 'Adopta un tono puramente humorístico. Tu objetivo es hacer reír o entretener de forma ligera. Usa juegos de palabras, exageraciones y observaciones graciosas de lo cotidiano.' + baseInstruction,
            'pure_ironic': 'Adopta un tono puramente irónico. Tu objetivo es señalar lo absurdo diciendo exactamente lo contrario. Usa un sarcasmo elegante y críticas indirectas.' + baseInstruction,
            'pure_curious': 'Adopta un tono puramente curioso. Tu objetivo es despertar el interés y crear un gancho (hook). Usa preguntas o frases incompletas que dejen al lector queriendo saber más.' + baseInstruction,
            'pure_emotional': 'Actúa como un escritor de contenido emocional. Tu objetivo es crear una identificación profunda y sentimental. Usa frases que exploren sentimientos universales como el dolor, el amor o la soledad.' + baseInstruction,
            'pure_critical': 'Adopta un tono puramente crítico. Tu objetivo es exponer una opinión fuerte y directa. Usa frases tajantes, juicios y declaraciones firmes sobre un tema.' + baseInstruction,
            'pure_motivational': 'Adopta un tono puramente motivacional. Tu objetivo es inspirar y empoderar al lector. Usa imperativos, frases de aliento y llamados a la acción.' + baseInstruction,
            'pure_double_meaning': 'Adopta un tono puramente de doble sentido. Tu objetivo es jugar con la ambigüedad para conectar de forma pícara. Usa insinuaciones y frases con doble lectura.' + baseInstruction,
            'pure_dramatic': 'Adopta un tono puramente dramático. Tu objetivo es impactar emocionalmente. Usa un lenguaje intenso, profundo y con carga sentimental para describir una situación.' + baseInstruction
        };
        return toneMap[toneKey] || 'Actúa como un copywriter experto en redes sociais. Escribe en un tono neutro e informativo.' + baseInstruction;
    };

    const getPersonaInstruction = (contentType) => {
        const baseInstruction = "Usa siempre un lenguaje natural, coloquial y fácil de entender, como el español que se habla en México. Evita palabras demasiado formales o rebuscadas.";
        switch (contentType) {
            case 'frase_opinion':
                return `Actúa como un copywriter persuasivo. ${baseInstruction}`;
            case 'debate':
                return `Actúa como un estratega en interacción y engagement. ${baseInstruction}`;
            case 'emocional':
            case 'reflexion':
            case 'final':
                return `Actúa como un experto en psicología emocional y storytelling persuasivo. ${baseInstruction}`;
            case 'mananera':
                return `Actúa como un experto en copywriting emocional, neuromarketing y creación de frases virales. ${baseInstruction}`;
            case 'cristiana':
                return `Actúa como un creador cristiano experto en reflexiones virales y copywriting espiritual. ${baseInstruction}`;
            case 'debatible':
                return `Actúa como un experto en engagement y neuromarketing emocional. ${baseInstruction}`;
            case 'manipuladora':
                return `Actúa como experto en psicología emocional y neuromarketing sugestivo. ${baseInstruction}`;
            case 'meme':
            default:
                // For 'meme', the persona is defined by the more specific tone selector
                return getToneInstruction(aiToneSelect.value);
        }
    };

    const getLengthInstruction = (lengthKey) => {
        const lengthMap = {
            'muy corto': '12 palabras',
            'corto': '20 palabras',
            'medio': '35 palabras'
        };
        return lengthMap[lengthKey] || '35 palabras';
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
            modeAiTrendBtn.disabled = false;
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
        [modeManualBtn, modeAiTopicBtn, modeAiImageBtn, modeAiTrendBtn].forEach(btn => btn.classList.remove('active'));
        
        // Hide all containers first
        manualInputContainer.style.display = 'none';
        aiInputContainer.classList.add('hidden');
        aiTopicGroup.classList.add('hidden');
        aiTrendGroup.classList.add('hidden');

        switch(mode) {
            case 'ai-topic':
                modeAiTopicBtn.classList.add('active');
                aiInputContainer.classList.remove('hidden');
                aiTopicGroup.classList.remove('hidden');
                generateBtn.textContent = 'Generar por Tema';
                break;
            case 'ai-image':
                modeAiImageBtn.classList.add('active');
                aiInputContainer.classList.remove('hidden');
                // No specific group for ai-image, so aiTopicGroup and aiTrendGroup remain hidden
                generateBtn.textContent = 'Analizar y Generar';
                break;
            case 'ai-trend':
                modeAiTrendBtn.classList.add('active');
                aiInputContainer.classList.remove('hidden');
                aiTrendGroup.classList.remove('hidden');
                generateBtn.textContent = 'Generar por Tendencia';
                break;
            case 'manual':
            default:
                modeManualBtn.classList.add('active');
                manualInputContainer.style.display = 'block';
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
        
        const contentType = contentTypeSelector.value;
        const personaInstruction = getPersonaInstruction(contentType);
        const toneDescription = aiToneSelect.options[aiToneSelect.selectedIndex].text;
        const quantity = aiQuantityInput.value;
        const reaction = aiReactionSelect.value;
        const lengthInstruction = getLengthInstruction(currentAiLength);
        
        let prompt;
        let config = {};
        let contents;

        // Construct base prompt based on persona
        let basePrompt;
        if (contentType === 'meme') {
            basePrompt = `**Rol:** ${personaInstruction}`;
        } else {
            basePrompt = `**Rol:** ${personaInstruction}\n**Tono Adicional (Modificador):** "${toneDescription}"`;
        }


        if (currentTitleMode === 'ai-image') {
            if (!currentBaseImage) throw new Error('No se ha subido ninguna imagen para analizar.');
            prompt = `${basePrompt}
**Misión:** Convertir la imagen proporcionada en ${quantity} ideas de posts potentes. Cada idea debe ser un título o frase que genere una reacción emocional fuerte y fomente la interacción.
**Contexto:**
- Objetivo (Reacción Buscada): Las frases deben generar primordialmente "${reaction}".
- Longitud Máxima: Cada frase no debe superar las ${lengthInstruction}.
**Instrucciones:**
1.  **Análisis Profundo:** Detecta la emoción principal de la imagen, infiere la historia o situación cotidiana que representa, y considera qué público podría sentirse más identificado.
2.  **Generación de Títulos:** Genera exactamente ${quantity} títulos distintos. Cada uno debe tener un enfoque o ángulo ligeramente diferente.
**Formato de Salida Obligatorio:** El resultado DEBE ser un objeto JSON válido que siga el esquema proporcionado. No incluyas explicaciones, saludos, ni formato Markdown (\`\`\`json).`;
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: currentBaseImage.split(',')[1] } };
            const textPart = { text: prompt };
            contents = { parts: [imagePart, textPart] };
            config = { responseMimeType: "application/json", responseSchema: titlesSchema };

        } else if (currentTitleMode === 'ai-topic') {
            const topic = aiTopicInput.value.trim();
            if (!topic) throw new Error('Por favor, introduce un tema principal para la generación de títulos.');
            
            let topicPrompt;
             if (contentType === 'meme') {
                topicPrompt = `${personaInstruction}. Tu misión es crear ${quantity} frases virales para redes sociais sobre: "${topic}".`;
            } else {
                topicPrompt = `Tu rol es: ${personaInstruction}. Tu misión es crear ${quantity} frases virales para redes sociais sobre: "${topic}". Adicionalmente, aplica el siguiente tono/enfoque específico: "${toneDescription}".`;
            }

            prompt = `${topicPrompt}
**Reglas:**
- Formato: Cortas, naturales, estilo humano.
- Longitud Máxima: ${lengthInstruction}.
- Objetivo: Generar ${reaction}.
- No incluyas hashtags, números, ni comillas.
**Formato de Salida Obligatorio:** El resultado DEBE ser un objeto JSON que siga el esquema proporcionado, sin explicaciones adicionales.`;
            contents = prompt;
            config = { responseMimeType: "application/json", responseSchema: titlesSchema };
        
        } else if (currentTitleMode === 'ai-trend') {
            if (!currentBaseImage) throw new Error('Por favor, sube una imagen base para el modo de tendencia.');
            const trendTopic = aiTrendTopicInput.value.trim();
            
            const dateFilterValue = aiTrendDateFilter.value;
            let dateInstruction = '';
            switch(dateFilterValue) {
                case 'hour': dateInstruction = ' que ocurrieron en la última hora'; break;
                case '4hours': dateInstruction = ' que ocurrieron en las últimas 4 horas'; break;
                case '24hours': dateInstruction = ' que ocurrieron en las últimas 24 horas'; break;
                case '48hours': dateInstruction = ' que ocurrieron en las últimas 48 horas'; break;
                case '7days': dateInstruction = ' que ocurrieron en los últimos 7 días'; break;
                case 'any': default: dateInstruction = ''; break;
            }

            const searchInstruction = trendTopic
                ? `sobre "${trendTopic}"`
                : `generales y virales del momento`;

            prompt = `${basePrompt}
**Misión:** Crear ${quantity} títulos virales que combinen el análisis de una imagen con una tendencia de noticias.
**Proceso Obligatorio:**
1.  **Análisis de Imagen:** Primero, analiza la imagen proporcionada. Identifica su emoción principal, el contexto y la situación que representa (ej: frustración, alegría, sorpresa).
2.  **Investigación de Tendencia:** Luego, realiza una búsqueda en Google sobre noticias y conversaciones recientes ${searchInstruction}${dateInstruction}.
3.  **Síntesis Creativa:** Combina los hallazgos de la imagen y la búsqueda. Los ${quantity} títulos generados deben tratar sobre la tendencia investigada, pero usando el sentimiento o la situación de la imagen como vehículo para el mensaje. Por ejemplo, si la imagen es de alguien estresado y la tendencia es el lanzamiento de un nuevo teléfono, un buen título sería "Yo, intentando entender si necesito el nuevo teléfono".
**Reglas Adicionales:**
- Objetivo (Reacción Buscada): Generar ${reaction}.
- Longitud Máxima: ${lengthInstruction}.
- No incluyas hashtags, números, ni comillas.
**Formato de Salida Obligatorio:** Devuelve un único objeto JSON válido, sin formato Markdown (sin \`\`\`json). El objeto debe tener una sola clave "titles", que es un array de strings. Ejemplo: {"titles": ["título 1", "título 2"]}`;

            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: currentBaseImage.split(',')[1] } };
            const textPart = { text: prompt };
            contents = { parts: [imagePart, textPart] };
            config = { tools: [{ googleSearch: {} }] };

        } else {
             throw new Error(`Modo de generación AI no reconocido: ${currentTitleMode}`);
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: config
        });
        
        let jsonString = response.text.trim();

        // Robust parsing for both JSON and non-JSON responses from googleSearch
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.substring(3, jsonString.length - 3).trim();
        }

        try {
            const parsedJson = JSON.parse(jsonString);
            if (parsedJson.titles && Array.isArray(parsedJson.titles)) {
                return parsedJson.titles;
            }
             if (Array.isArray(parsedJson)) { // Handle cases where AI returns a raw array
                return parsedJson;
            }
        } catch (e) {
            console.warn("Respuesta de IA no es JSON, intentando fallback:", jsonString);
            const lines = jsonString.split('\n').map(line => {
                // Clean up potential markdown list characters or numbering
                return line.replace(/^[-*]\s*|^\d+\.\s*/, '').trim();
            }).filter(line => line && !line.includes('{') && !line.includes('}'));

            if (lines.length > 0) return lines;
        }

        throw new Error("La IA no devolvió ningún título en el formato esperado.");
    };

    const displayPostResults = (titles) => {
        resultsGrid.innerHTML = '';
        resultsHeader.classList.add('hidden');
        if (titles.length === 0) return;

        titles.forEach((title, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            const postClone = previewTemplate.cloneNode(true);
            
            // Remove all IDs from the clone and its descendants to prevent conflicts
            postClone.removeAttribute('id');
            postClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

            const titleElement = postClone.querySelector('.image-post-title');
            titleElement.textContent = title;
            
            // Apply current styles to the clone
            titleElement.style.fontFamily = previewTitle.style.fontFamily;
            previewTitle.classList.forEach(cls => {
                if (cls.startsWith('font-') || cls.startsWith('align-')) {
                    titleElement.classList.add(cls);
                }
            });

            // Make title editable
            titleElement.addEventListener('click', () => makeEditable(titleElement));
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-single-btn';
            downloadBtn.textContent = 'Descargar';
            downloadBtn.onclick = async () => {
                try {
                    // Ensure no element is being edited during capture
                    const currentlyEditing = postClone.querySelector('[contenteditable="true"]');
                    if (currentlyEditing) currentlyEditing.blur();

                    const canvas = await html2canvas(postClone, { useCORS: true, backgroundColor: '#ffffff' });
                    const dataUrl = canvas.toDataURL('image/png');
                    const newTab = window.open();
                    if (newTab) {
                        newTab.document.write(`<body style="margin:0;"><img src="${dataUrl}" style="width:100%; height:auto;"></body>`);
                        newTab.document.title = `post_imagen_${index + 1}`;
                    } else {
                        alert("Tu navegador bloqueó la nueva pestaña. Por favor, permite las ventanas emergentes para este sitio.");
                    }
                } catch (error) {
                    console.error("Error al generar imagen para el post:", error);
                    alert("No se pudo generar la imagen del post.");
                }
            };
            
            resultItem.appendChild(postClone);
            resultItem.appendChild(downloadBtn);
            resultsGrid.appendChild(resultItem);
        });

        resultsHeader.classList.remove('hidden');
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

            toggleLoading(true, `Mostrando ${titlesToGenerate.length} resultados editables...`);
            displayPostResults(titlesToGenerate);

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
    previewTitle.addEventListener('click', () => makeEditable(previewTitle));
    
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
    modeAiTrendBtn.addEventListener('click', () => switchTitleMode('ai-trend'));

    aiLengthSelector.addEventListener('click', (e) => {
        const button = e.target.closest('.mode-btn');
        if (button && button.dataset.length) {
            currentAiLength = button.dataset.length;
            aiLengthSelector.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });

    generateBtn.addEventListener('click', generatePosts);
    downloadAllBtn.addEventListener('click', () => {
        const postElements = resultsGrid.querySelectorAll('.post-template');
        if (postElements.length > 0) {
            downloadAllAsZip(Array.from(postElements), 'image-posts');
        } else {
            alert('No hay posts generados para descargar.');
        }
    });

    // --- Init ---
    loadProfileData();
    setActiveTemplate('facebook');
    updateTitleFont();
    switchTitleMode('manual');
    // Set initial alignment
    alignSelector.querySelector('.align-btn').classList.add('active');
    previewTitle.classList.add('align-left');
};
