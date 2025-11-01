

import { Type } from "@google/genai";
import { getAiInstance } from '../services/api.js';
import { makeEditable } from "../utils/ui.js";
import { downloadAllAsZip } from "../utils/helpers.js";

export const initPostTextGenerator = () => {
    // --- Elements ---
    const templateBtnFacebook = document.getElementById('template-btn-facebook');
    const templateBtnTwitter = document.getElementById('template-btn-twitter');
    const twitterOptionsContainer = document.getElementById('twitter-options-container');
    const toggleVerifiedBadgeTwitter = document.getElementById('toggle-verified-badge-twitter');
    const facebookOptionsContainer = document.getElementById('facebook-options-container');
    const toggleVerifiedBadgeFacebook = document.getElementById('toggle-verified-badge-facebook');
    const postTextsInput = document.getElementById('post-texts-input');
    const generatePostsBtn = document.getElementById('generate-posts-btn');
    const postPreviewTemplate = document.getElementById('post-preview-template');
    const postProfilePicDiv = postPreviewTemplate.querySelector('.post-profile-pic');
    const postProfilePicImg = postPreviewTemplate.querySelector('.post-profile-pic img');
    const postProfilePicUpload = document.getElementById('post-profile-pic-upload');
    const postNameSpan = postPreviewTemplate.querySelector('.post-name');
    const postUsernameSpan = postPreviewTemplate.querySelector('.post-username');
    const postTextP = postPreviewTemplate.querySelector('.post-text');
    const resultsHeader = document.querySelector('#post-results-area .results-header');
    const resultsGrid = document.getElementById('results-grid');
    const downloadAllZipBtn = document.getElementById('download-all-zip-btn');
    const postGeneratorLoader = document.getElementById('post-generator-loader');
    const postGeneratorLoaderText = postGeneratorLoader.querySelector('p');
    const textAlignSelector = document.getElementById('text-align-selector');
    const modeManualBtn = document.getElementById('mode-manual-btn');
    const modeAiTopicBtn = document.getElementById('mode-ai-topic-btn');
    const modeAiTrendBtn = document.getElementById('mode-ai-trend-btn');
    const manualInputContainer = document.getElementById('manual-input-container');
    const aiInputContainer = document.getElementById('ai-input-container');
    const aiTopicGroup = document.getElementById('ai-topic-group');
    const aiTopicInput = document.getElementById('ai-topic');
    const aiTrendGroup = document.getElementById('ai-trend-group');
    const aiTrendTopicInput = document.getElementById('ai-trend-topic');
    const aiTrendDateFilter = document.getElementById('ai-trend-date-filter');
    const contentTypeSelector = document.getElementById('post-content-type-selector');
    const contentTypeTooltip = document.getElementById('content-type-tooltip');
    const aiToneSelect = document.getElementById('ai-tone');
    const aiReactionSelect = document.getElementById('ai-reaction');
    const aiLengthSelector = document.getElementById('ai-length-selector');
    const aiQuantityInput = document.getElementById('ai-quantity');
    const fontSelector = document.getElementById('post-font-selector');
    
    // Niche system elements
    const nicheInspirationContainer = document.getElementById('niche-inspiration-container');
    const nicheSelectorContainer = document.getElementById('niche-selector');
    const subnicheSelectorContainer = document.getElementById('subniche-selector-container');
    const subnicheSelector = document.getElementById('subniche-selector');
    const microthemeSuggestionsContainer = document.getElementById('microtheme-suggestions-container');
    const microthemeSuggestions = document.getElementById('microtheme-suggestions');


    // --- State ---
    let currentPostGenMode = 'manual';
    let currentAiLength = 'medio';

    const contentStrategyMap = {
        'meme': { tone: 'sarcastic_humorous', reaction: 'risa e identificación', tooltip: 'Ideal para viralidad y humor rápido. Busca que la gente se ría y etiquete a sus amigos.' },
        'frase_opinion': { tone: 'emotional_reflective', reaction: 'reflexión profunda', tooltip: 'Busca generar conexión emocional o una reflexión breve. Ideal para guardados y comentarios de acuerdo/desacuerdo.' },
        'debate': { tone: 'polemic_opinative', reaction: 'polémica y debate', tooltip: 'Perfecto para generar comentarios masivos y opiniones divididas. Usa un tono fuerte y directo.' },
        'debatible': { tone: 'ironic_critical', reaction: 'comentarios y participación', tooltip: 'Genera interacción sin tanto conflicto. Invita a la gente a dar su punto de vista sobre una idea.' },
        'emocional': { tone: 'dramatic_emotional', reaction: 'emoción y empatía', tooltip: 'Conecta con los sentimientos del público. Busca que comenten "me pasó" o "justo lo que necesitaba leer".' },
        'mananera': { tone: 'pure_motivational', reaction: 'inspiración y motivación', tooltip: 'Para empezar el día con energía positiva. Busca likes y comentarios de "buenos días".' },
        'reflexion': { tone: 'emotional_reflective', reaction: 'reflexión profunda', tooltip: 'Para cerrar el día con una idea profunda. Fomenta que se guarde y se comparta con alguien especial.' },
        'final': { tone: 'inspiring_reflective', reaction: 'inspiración y motivación', tooltip: 'Ofrece un cierre positivo o inspirador. Ideal para generar lealtad y comentarios de agradecimiento.' },
        'cristiana': { tone: 'pure_suggestive', reaction: 'fe y agradecimiento', tooltip: 'Conecta a un nivel espiritual. Busca comentarios como "Amén" y que se comparta en grupos de fe.' },
        'manipuladora': { tone: 'pure_suggestive', reaction: 'compartidos masivos', tooltip: 'Usa un gancho psicológico para alta retención. Frases como "Si lees esto, es una señal..."' }
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

    // --- Functions ---
    const updateAiSuggestions = (contentType) => {
        const strategy = contentStrategyMap[contentType];
        if (strategy) {
            aiToneSelect.value = strategy.tone;
            aiReactionSelect.value = strategy.reaction;
            contentTypeTooltip.textContent = `💡 Sugerencia: ${strategy.tooltip}`;
        } else {
            contentTypeTooltip.textContent = '';
        }
    };

    const savePostTemplateData = () => {
        const data = {
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
                const data = JSON.parse(savedData);
                if (data.profilePic) postProfilePicImg.src = data.profilePic;
                if (data.name) postNameSpan.textContent = data.name;
                if (data.username) postUsernameSpan.textContent = data.username;
            } catch (e) {
                console.error("Error al cargar los datos de la plantilla de post:", e);
            }
        }
    };
    
    const updatePostFont = () => {
        postTextP.style.fontFamily = `'${fontSelector.value}', sans-serif`;
    };

    const updateVerifiedBadgeVisibility = () => {
        const isFacebook = postPreviewTemplate.classList.contains('facebook');
        if (isFacebook) {
            postPreviewTemplate.classList.toggle('show-verified', toggleVerifiedBadgeFacebook.checked);
        } else { // Assumes twitter is the only other option
            postPreviewTemplate.classList.toggle('show-verified', toggleVerifiedBadgeTwitter.checked);
        }
    };

    const setActiveTemplate = (templateName) => {
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

    const handlePostProfilePicUpload = (event) => {
        const input = event.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    postProfilePicImg.src = e.target.result;
                    savePostTemplateData();
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    const switchPostGenMode = (mode) => {
        currentPostGenMode = mode;
        [modeManualBtn, modeAiTopicBtn, modeAiTrendBtn].forEach(btn => btn.classList.remove('active'));
        
        // Hide all dynamic containers first
        manualInputContainer.style.display = 'none';
        aiInputContainer.classList.add('hidden');
        aiTopicGroup.classList.add('hidden');
        aiTrendGroup.classList.add('hidden');
        nicheInspirationContainer.classList.add('hidden'); // Hide niche container by default

        switch (mode) {
            case 'ai-topic':
                modeAiTopicBtn.classList.add('active');
                aiInputContainer.classList.remove('hidden');
                aiTopicGroup.classList.remove('hidden');
                nicheInspirationContainer.classList.remove('hidden'); // Only show for 'ai-topic'
                generatePostsBtn.textContent = 'Generar por Tema';
                break;
            case 'ai-trend':
                modeAiTrendBtn.classList.add('active');
                aiInputContainer.classList.remove('hidden');
                aiTrendGroup.classList.remove('hidden');
                // Niche container remains hidden
                generatePostsBtn.textContent = 'Generar por Tendencia';
                break;
            case 'manual':
            default:
                modeManualBtn.classList.add('active');
                manualInputContainer.style.display = 'block';
                 // Niche container remains hidden
                generatePostsBtn.textContent = 'Generar Posts';
                break;
        }
    };

    const togglePostLoading = (isLoading, message = 'Generando imágenes...') => {
        postGeneratorLoaderText.textContent = message;
        postGeneratorLoader.classList.toggle('hidden', !isLoading);
        generatePostsBtn.disabled = isLoading;
    };

    const getToneInstruction = (toneKey) => {
        const baseInstruction = " Usa siempre un lenguaje natural, coloquial y fácil de entender, como el español que se habla en México. Evita palabras demasiado formales o rebuscadas.";
        const toneMap = {
            'sarcastic_humorous': 'Actúa como un copywriter profesional con un humor ácido. Tu objetivo es hacer reír mientras te burlas de una realidad absurda. Usa frases como "Claro...", "Obvio...", exageraciones y dobles sentidos para crear memes o desahogos cotidianos virales.' + baseInstruction,
            'polemic_opinative': 'Actúa como un creador de contenido que busca generar debate. Tu objetivo es dividir opiniones en los comentarios. Usa absolutos como "siempre", "nunca", comparaciones y juicios directos sobre temas sociales o de relaciones.' + baseInstruction,
            'ironic_critical': 'Actúa como un crítico social con un tono de sarcasmo elegante. Tu objetivo es denunciar o señalar una situación con ironía. Usa contradicciones y un tono seco para hablar de actitudes tóxicas o problemas sociales.' + baseInstruction,
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
            'pure_emotional': 'Adopta un tono puramente emocional. Tu objetivo es crear una conexión profunda y sentimental. Usa frases que exploren sentimientos universales como el dolor, el amor o la soledad.' + baseInstruction,
            'pure_critical': 'Adopta un tono puramente crítico. Tu objetivo es exponer una opinión fuerte y directa. Usa frases tajantes, juicios y declaraciones firmes sobre un tema.' + baseInstruction,
            'pure_motivational': 'Adopta un tono puramente motivacional. Tu objetivo es inspirar y empoderar al lector. Usa imperativos, frases de aliento y llamados a la acción.' + baseInstruction,
            'pure_double_meaning': 'Adopta un tono puramente de doble sentido. Tu objetivo es jugar con la ambigüedad para conectar de forma pícara. Usa insinuaciones y frases con doble lectura.' + baseInstruction,
            'pure_reflective': `Adopta un tono puramente reflexivo. Tu objetivo es provocar un pensamiento maduro o una introspección. Usa frases que inviten a la sabiduría o a cuestionar la vida.` + baseInstruction,
            'pure_suggestive': `Adopta un tono puramente sugestivo o espiritual. Tu objetivo es crear un efecto psicológico o de conexión mística. Usa frases como "Si estás leyendo esto..." para crear un sentido de destino o casualidad.` + baseInstruction,
        };
        return toneMap[toneKey] || 'Actúa como un copywriter experto en redes sociales. Escribe en un tono neutro e informativo.' + baseInstruction;
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

    const generatePostTextsWithAI = async () => {
        const ai = getAiInstance();
        if (!ai) {
            throw new Error('Por favor, introduce tu clave API para usar la generación con IA.');
        }

        const contentType = contentTypeSelector.value;
        const personaInstruction = getPersonaInstruction(contentType);
        const reaction = aiReactionSelect.options[aiReactionSelect.selectedIndex].text;
        const lengthInstruction = getLengthInstruction(currentAiLength);
        const quantity = aiQuantityInput.value;
        const toneDescription = aiToneSelect.options[aiToneSelect.selectedIndex].text;

        let prompt;
        let config;
        
        // Construct the prompt based on persona and tone
        let basePrompt;
        if (contentType === 'meme') {
             basePrompt = `${personaInstruction}. Tu misión es crear ${quantity} frases virales para redes sociales.`;
        } else {
            basePrompt = `Tu rol es: ${personaInstruction}. Tu misión es crear ${quantity} frases virales para redes sociales. Adicionalmente, aplica el siguiente tono/enfoque específico: "${toneDescription}".`;
        }


        if (currentPostGenMode === 'ai-topic') {
            const topic = aiTopicInput.value.trim();
            prompt = topic
                ? `${basePrompt} El tema principal es: "${topic}".

Reglas estrictas:
- Formato: Las frases deben ser cortas, naturales, con estilo humano, como las que se usan en imágenes o memes.
- Longitud: Máximo ${lengthInstruction} por frase.
- Objetivo Principal: Las frases deben generar ${reaction}.
- No incluyas hashtags, números de lista, ni comillas alrededor de cada frase.

El resultado debe ser un objeto JSON que siga el esquema proporcionado, sin explicaciones adicionales.`
                : `${basePrompt} Cada frase debe ser sobre un tema completamente diferente y sin relación con las otras.

Reglas estrictas:
- Temas: Debes inventar los temas para cada frase. Asegúrate de que haya una gran diversidad. Por ejemplo, una frase puede ser sobre el desamor, otra sobre el trabajo, otra sobre una situación cómica del día a día, etc. La clave es la máxima variedad posible entre las frases.
- Formato: Las frases deben ser cortas, naturales, con estilo humano, como las que se usan en imágenes o memes.
- Longitud: Máximo ${lengthInstruction} por frase.
- Objetivo Principal: Las frases deben generar ${reaction}.
- No incluyas hashtags, números de lista, ni comillas alrededor de cada frase.

El resultado debe ser un objeto JSON que siga el esquema proporcionado, sin explicaciones adicionales.`;

            config = { responseMimeType: "application/json", responseSchema: postsSchema };
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: config
            });
            const parsedJson = JSON.parse(response.text.trim());
            if (parsedJson.posts && parsedJson.posts.length > 0) {
                return parsedJson.posts;
            } else {
                throw new Error("La IA no devolvió ninguna publicación.");
            }

        } else if (currentPostGenMode === 'ai-trend') {
            const trendTopic = aiTrendTopicInput.value.trim();
            
            const dateFilterValue = aiTrendDateFilter.value;
            let dateInstruction = '';
            switch(dateFilterValue) {
                case 'hour':
                    dateInstruction = ' que ocurrieron en la última hora';
                    break;
                case '4hours':
                    dateInstruction = ' que ocurrieron en las últimas 4 horas';
                    break;
                case '24hours':
                    dateInstruction = ' que ocurrieron en las últimas 24 horas';
                    break;
                case '48hours':
                    dateInstruction = ' que ocurrieron en las últimas 48 horas';
                    break;
                case '7days':
                    dateInstruction = ' que ocurrieron en los últimos 7 días';
                    break;
                case 'any':
                default:
                    dateInstruction = '';
                    break;
            }

            const searchInstruction = trendTopic
                ? `relacionadas con el siguiente tema: "${trendTopic}"`
                : `generales y más virales del momento`;

            prompt = `${basePrompt}

Paso 1: Investigación.
Primero, realiza una búsqueda en Google sobre las últimas noticias, conversaciones y tendencias ${searchInstruction}${dateInstruction}.

Paso 2: Generación.
Basándote en los resultados más relevantes y recientes de tu búsqueda, genera ${quantity} frases que cumplan con estos requisitos:
- Formato: Las frases deben ser cortas, naturales, con estilo humano, como las que se usan en imágenes o memes.
- Longitud: Máximo ${lengthInstruction} por frase.
- Objetivo Principal: Las frases deben generar ${reaction}.
- No incluyas hashtags, números de lista, ni comillas alrededor de cada frase.

Paso 3: Formato de Salida Obligatorio.
Devuelve tu respuesta como un único objeto JSON válido, sin formato Markdown (sin \`\`\`json). El objeto debe tener una sola clave "posts", que es un array de strings, donde cada string es una de las frases generadas. Ejemplo: {"posts": ["frase 1", "frase 2"]}`;
            
            config = { tools: [{ googleSearch: {} }] };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: config
            });

            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }

            try {
                const parsedJson = JSON.parse(jsonString);
                if (parsedJson.posts && Array.isArray(parsedJson.posts)) {
                    return parsedJson.posts;
                }
            } catch (e) {
                console.error("Error al parsear la respuesta JSON de la búsqueda de tendencias:", e, "Respuesta recibida:", jsonString);
                // Fallback: si no es JSON, intenta dividir por saltos de línea
                const lines = jsonString.split('\n').filter(line => line.trim() && !line.includes('{') && !line.includes('}'));
                if (lines.length > 0) return lines;
                throw new Error("La respuesta de la IA sobre tendencias no pudo ser procesada.");
            }
            throw new Error("La IA no devolvió ninguna publicación en el formato esperado.");
        } else {
            throw new Error("Modo de generación AI no reconocido.");
        }
    };
    
    const displayPostResults = (texts) => {
        resultsGrid.innerHTML = '';
        resultsHeader.classList.add('hidden');
    
        if (texts.length === 0) return;

        texts.forEach((text, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            const postClone = postPreviewTemplate.cloneNode(true);
            
            // Remove all IDs from the clone and its descendants to prevent conflicts
            postClone.removeAttribute('id');
            postClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

            const textElement = postClone.querySelector('.post-text');
            textElement.textContent = text;
            textElement.style.fontFamily = postTextP.style.fontFamily; // Ensure font is copied

            // Make text editable
            textElement.addEventListener('click', () => makeEditable(textElement));
            
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
                        newTab.document.title = `post_${index + 1}`;
                    } else {
                        alert("Tu navegador bloqueó la nueva pestaña. Por favor, permite las ventanas emergentes para este sitio.");
                    }
                } catch (error) {
                    console.error("Error al generar la imagen para el post:", error);
                    alert("No se pudo generar la imagen.");
                }
            };
            
            resultItem.appendChild(postClone);
            resultItem.appendChild(downloadBtn);
            resultsGrid.appendChild(resultItem);
        });
        
        resultsHeader.classList.remove('hidden');
    };

    const generatePosts = async () => {
        togglePostLoading(true, 'Iniciando generación...');
        try {
            let textsToGenerate = [];

            if (currentPostGenMode.startsWith('ai')) {
                togglePostLoading(true, 'Generando textos con IA...');
                textsToGenerate = await generatePostTextsWithAI();
            } else { // Manual mode
                textsToGenerate = postTextsInput.value.split('\n').filter(text => text.trim() !== '');
            }

            if (textsToGenerate.length === 0) {
                alert('No hay textos para generar. Por favor, escribe o genera textos primero.');
                return;
            }

            togglePostLoading(true, 'Mostrando resultados editables...');
            displayPostResults(textsToGenerate);

        } catch (error) {
            console.error("Error al generar posts:", error);
            alert(`Error: ${error.message}`);
        } finally {
            togglePostLoading(false);
        }
    };
    
    // --- Niche System Logic ---
    const nicheData = [
        { niche: "Humor y Entretenimiento", subniches: [
            { name: "Humor cotidiano", microtemas: ["vida diaria", "tráfico", "familia", "suegros", "memes de WhatsApp", "conversaciones graciosas"] },
            { name: "Humor de pareja", microtemas: ["celos", "vida en pareja", "conversaciones graciosas", "expectativa vs realidad"] },
            { name: "Humor laboral", microtemas: ["jefes tóxicos", "compañeros de trabajo", "reuniones inútiles", "lunes por la mañana"] },
            { name: "Humor escolar", microtemas: ["tareas", "maestros", "exámenes"] },
            { name: "Humor negro / sarcástico", microtemas: ["sarcasmo", "ironía", "humor ácido", "crítica social"] },
            { name: "Humor de situaciones absurdas", microtemas: ["cosas sin sentido", "mala suerte", "momentos incómodos"] }
        ]},
        { niche: "Drama y Confesiones", subniches: [
            { name: "Confesiones anónimas", microtemas: ["infidelidad", "secretos", "arrepentimiento", "venganza", "traición"] },
            { name: "Historias reales impactantes", microtemas: ["superación", "karma", "lecciones de vida", "abandono"] },
            { name: "Problemas de pareja", microtemas: ["discusiones", "ruptura", "celos", "traición", "reconciliación"] },
            { name: "Reflexiones personales", microtemas: ["soledad", "cambio de vida", "superación", "errores del pasado", "arrepentimiento"] },
            { name: "Secretos familiares", microtemas: ["herencias", "conflictos familiares", "revelaciones", "traición familiar"] }
        ]},
        { niche: "Relación y Pareja", subniches: [
            { name: "Amor y desamor", microtemas: ["indirectas de amor", "extrañar a alguien", "nuevo amor", "corazón roto", "crush"] },
            { name: "Relaciones tóxicas", microtemas: ["manipulación", "banderas rojas", "amor propio", "dejar ir", "celos"] },
            { name: "Rupturas y reconciliaciones", microtemas: ["ex parejas", "relaciones fallidas", "volver con tu ex", "superar una ruptura"] },
            { name: "Humor romántico", microtemas: ["cosas de novios", "citas graciosas", "ligar", "coqueteo", "WhatsApp"] },
            { name: "Frases de amor / indirectas", microtemas: ["indirectas amorosas", "frases para dedicar", "poesía", "amor a distancia"] }
        ]},
        { niche: "Motivación y Superación", subniches: [
            { name: "Frases motivacionales", microtemas: ["metas", "sueños", "nunca rendirse", "éxito", "disciplina", "caídas"] },
            { name: "Historias inspiradoras", microtemas: ["superación personal", "casos de éxito", "cambio de vida", "resiliencia"] },
            { name: "Desarrollo personal", microtemas: ["autoestima", "resiliencia", "crecimiento personal", "nuevos hábitos", "errores"] },
            { name: "Emprendimiento emocional", microtemas: ["miedo al fracaso", "mentalidad de emprendedor", "logros", "inspiración"] }
        ]},
        { niche: "Polémica y Opinión Social", subniches: [
            { name: "Debate social / feminismo / machismo", microtemas: ["feminismo", "machismo", "igualdad", "privilegios", "roles de género"] },
            { name: "Crítica a la sociedad", microtemas: ["redes sociales", "influencers", "doble moral", "cultura moderna", "generaciones"] },
            { name: "Tópicos controversiales", microtemas: ["política ligera", "religión", "temas tabú", "cancelación"] },
            { name: "Opinión sobre noticias virales", microtemas: ["tendencias", "noticias del día", "chismes de famosos", "eventos actuales"] }
        ]},
        { niche: "Curiosidades y Datos Sorprendentes", subniches: [
            { name: "Datos curiosos del cuerpo o la mente", microtemas: ["cerebro", "sueños", "psicología", "amor", "cuerpo humano"] },
            { name: "Misterios y rarezas del mundo", microtemas: ["lugares abandonados", "casos sin resolver", "leyendas urbanas", "universo"] },
            { name: "Curiosidades históricas o culturales", microtemas: ["historia", "culturas antiguas", "inventos", "tradiciones raras"] },
            { name: "Tecnología y descubrimientos", microtemas: ["inteligencia artificial", "apps virales", "gadgets", "futuro", "ciencia curiosa", "TikTok"] }
        ]},
        { niche: "Emocional y Reflexivo", subniches: [
            { name: "Historias con moraleja", microtemas: ["lecciones de vida", "errores", "aprendizaje", "gratitud"] },
            { name: "Frases para pensar", microtemas: ["tiempo", "vida", "decisiones", "madurez", "familia", "soledad", "cambios"] },
            { name: "Reflexiones sobre la vida", microtemas: ["el paso del tiempo", "el propósito", "la felicidad", "el dolor"] },
            { name: "Historias anónimas con enseñanza", microtemas: ["superación", "perdón", "resiliencia", "amor propio"] }
        ]},
        { niche: "Sarcasmo e Ironía", subniches: [
            { name: "Frases sarcásticas", microtemas: ["trabajo", "relaciones", "vida adulta", "hipocresía", "dinero", "redes sociales"] },
            { name: "Situaciones irónicas", microtemas: ["mala suerte", "expectativa vs realidad", "karma instantáneo"] },
            { name: "Crítica disfrazada de humor", microtemas: ["redes sociales", "política ligera", "tendencias absurdas", "amistades falsas", `"yo no pero sí"`] }
        ]},
        { niche: "Doble Sentido y Picante", subniches: [
            { name: "Humor con malicia", microtemas: ["fiesta", "ligues", "coqueteo", "indirectas picantes", "frases con malicia"] },
            { name: "Frases con doble interpretación", microtemas: ["albures ligeros", "juegos de palabras", "situaciones ambiguas"] },
            { name: "Entrevistas o situaciones picarescas", microtemas: ["reacciones", "preguntas incómodas", "momentos atrevidos"] }
        ]},
        { niche: "Cotidiano / Vida Real", subniches: [
            { name: "Vida doméstica", microtemas: ["lavar trastes", "limpieza", "cocinar", "mascotas"] },
            { name: "Trabajo", microtemas: ["jefes", "compañeros", "reuniones", "sueldos", "cansancio"] },
            { name: "Escuela", microtemas: ["tareas", "maestros", "exámenes", "clases en línea"] },
            { name: "Adulting (vida adulta)", microtemas: ["pagar cuentas", "responsabilidades", "despertarse temprano", "tráfico", "lunes", "rutinas"] }
        ]},
        { niche: "Tecnología y Actualidad", subniches: [
            { name: "IA y apps virales", microtemas: ["inteligencia artificial", "ChatGPT", "Gemini", "TikTok", "reels"] },
            { name: "Tendencias digitales", microtemas: ["nuevas redes sociales", "memes del momento", "retos virales"] },
            { name: "Tutoriales rápidos", microtemas: ["hacks tecnológicos", "trucos para celular", "herramientas útiles"] },
            { name: "Noticias tech", microtemas: ["lanzamientos", "gadgets", "innovaciones", "el futuro de la tecnología"] }
        ]},
        { niche: "Deportes y Fútbol", subniches: [
            { name: "Fútbol (principalmente)", microtemas: ["Messi", "Cristiano", "clásico", "ligas", "polémicas", "jugadas"] },
            { name: "Deportes virales", microtemas: ["momentos épicos", "fails deportivos", "nuevos deportes"] },
            { name: "Humor deportivo", microtemas: ["memes de fútbol", "reacciones de fans", "burlas entre equipos"] },
            { name: "Opiniones y debates", microtemas: ["el mejor jugador", "polémicas arbitrales", "fanatismo", "frases de fútbol"] }
        ]},
        { niche: "Espiritualidad y Energía", subniches: [
            { name: "Energías, karma, vibras", microtemas: ["energías negativas", "karma instantáneo", "buenas vibras", "destino"] },
            { name: "Ley de atracción", microtemas: ["manifestación", "decretos", "visualización", "alineación espiritual"] },
            { name: "Signos zodiacales", microtemas: ["horóscopo", "compatibilidad zodiacal", "mercurio retrógrado", "características de signos"] }
        ]},
        { niche: "Belleza y Autoestima", subniches: [
            { name: "Cuidado personal", microtemas: ["skincare", "maquillaje", "rutinas de belleza", "consejos"] },
            { name: "Autoaceptación", microtemas: ["amor propio", "aceptar tu cuerpo", "inseguridades", "comparación"] },
            { name: "Belleza emocional", microtemas: ["sentirse bien", "confianza", "glow up", "belleza interior"] },
            { name: "Frases de amor propio", microtemas: ["empoderamiento", "autoestima", "poner límites", "estilo"] }
        ]},
        { niche: "Familia y Amistad", subniches: [
            { name: "Frases familiares", microtemas: ["mamá", "papá", "hermanos", "abuelos", "familia es primero"] },
            { name: "Historias entre padres e hijos", microtemas: ["anécdotas de la infancia", "consejos familiares", "conflictos generacionales"] },
            { name: "Amistades verdaderas o falsas", microtemas: ["amigos verdaderos", "amistades tóxicas", "amigos traicioneros", "lealtad"] }
        ]},
        { niche: "Cultura Pop y Entretenimiento", subniches: [
            { name: "Series y películas", microtemas: ["Netflix", "estrenos", "personajes", "frases de películas", "telenovelas"] },
            { name: "Famosos y chismes", microtemas: ["escándalos", "nuevas parejas", "noticias de artistas", "cultura mexicana"] },
            { name: "Música y trends", microtemas: ["trends de TikTok", "artistas del momento", "conciertos", "nostalgia noventera"] }
        ]},
        { niche: "Animales y Mascotas", subniches: [
            { name: "Memes de animales", microtemas: ["perros graciosos", "gatos haciendo cosas raras", "animales inesperados"] },
            { name: "Historias tiernas o tristes", microtemas: ["rescates", "adopciones", "animales ayudando a humanos"] },
            { name: "Reacciones graciosas", microtemas: ["comportamientos curiosos", "“cuando mi perro me ignora”", "mascotas siendo dramáticas"] }
        ]},
        { niche: "Terror y Misterio", subniches: [
            { name: "Historias paranormales", microtemas: ["fantasmas", "experiencias personales", "casas embrujadas"] },
            { name: "Leyendas urbanas", microtemas: ["mitos populares", "historias de terror locales", "criaturas misteriosas"] },
            { name: "Casos inexplicables", microtemas: ["sucesos reales", "videos misteriosos", "desapariciones", "teorías de conspiración"] }
        ]},
        { niche: "Estilo de Vida / Lifestyle", subniches: [
            { name: "Vida moderna", microtemas: ["rutina diaria", "estrés", "equilibrio mental", "ansiedad social"] },
            { name: "Minimalismo", microtemas: ["vivir con menos", "orden y limpieza", "consumismo", "paz mental"] },
            { name: "Tendencias sociales", microtemas: ["nuevas modas", "viajes", "productividad", "bienestar", "redes sociales"] }
        ]},
        { niche: "Finanzas y Dinero", subniches: [
            { name: "Finanzas personales", microtemas: ["deudas", "ahorro", "inversiones para principiantes", "presupuesto"] },
            { name: "Emprendimiento digital", microtemas: ["ideas de negocio", "side hustles", "marketing digital", "trabajo remoto"] },
            { name: "Crítica al sistema económico", microtemas: ["sueldos", "comparación social", "“cómo sobrevivo con $100”", "la carrera de la rata"] }
        ]}
    ];
    
    const populateNiches = () => {
        nicheSelectorContainer.innerHTML = '';
        nicheData.forEach(item => {
            const button = document.createElement('button');
            button.className = 'niche-btn';
            button.textContent = item.niche;
            button.dataset.niche = item.niche;
            nicheSelectorContainer.appendChild(button);
        });
    };
    
    const populateSubniches = (nicheName) => {
        const selectedNiche = nicheData.find(n => n.niche === nicheName);
        subnicheSelector.innerHTML = '';
        if (selectedNiche) {
            selectedNiche.subniches.forEach(subniche => {
                const button = document.createElement('button');
                button.className = 'subniche-btn';
                button.textContent = subniche.name;
                button.dataset.niche = nicheName;
                button.dataset.subniche = subniche.name;
                subnicheSelector.appendChild(button);
            });
            subnicheSelectorContainer.classList.remove('hidden');
        } else {
            subnicheSelectorContainer.classList.add('hidden');
        }
    };
    
    const populateMicrothemes = (nicheName, subnicheName) => {
        const selectedNiche = nicheData.find(n => n.niche === nicheName);
        const selectedSubniche = selectedNiche?.subniches.find(s => s.name === subnicheName);
        microthemeSuggestions.innerHTML = '';
        if (selectedSubniche) {
            selectedSubniche.microtemas.forEach(microtema => {
                const button = document.createElement('button');
                button.className = 'microtheme-btn';
                button.textContent = microtema;
                microthemeSuggestions.appendChild(button);
            });
            microthemeSuggestionsContainer.classList.remove('hidden');
        } else {
            microthemeSuggestionsContainer.classList.add('hidden');
        }
    };

    // --- Event Listeners ---
    templateBtnFacebook.addEventListener('click', () => setActiveTemplate('facebook'));
    templateBtnTwitter.addEventListener('click', () => setActiveTemplate('twitter'));

    toggleVerifiedBadgeFacebook.addEventListener('change', updateVerifiedBadgeVisibility);
    toggleVerifiedBadgeTwitter.addEventListener('change', updateVerifiedBadgeVisibility);

    postProfilePicDiv.addEventListener('click', () => postProfilePicUpload.click());
    postProfilePicUpload.addEventListener('change', handlePostProfilePicUpload);
    
    postNameSpan.addEventListener('click', () => makeEditable(postNameSpan, savePostTemplateData));
    postUsernameSpan.addEventListener('click', () => makeEditable(postUsernameSpan, savePostTemplateData));
    postTextP.addEventListener('click', () => makeEditable(postTextP));


    fontSelector.addEventListener('change', updatePostFont);
    
    textAlignSelector.addEventListener('click', (e) => {
        const button = e.target.closest('.align-btn');
        if (!button) return;

        const align = button.dataset.align;
        
        // Remove active class from all buttons
        textAlignSelector.querySelectorAll('.align-btn').forEach(btn => btn.classList.remove('active'));
        // Add active class to the clicked button
        button.classList.add('active');
        
        // Remove all alignment classes from the text element
        postTextP.classList.remove('align-left', 'align-center', 'align-right', 'align-justify');
        // Add the selected alignment class
        postTextP.classList.add(`align-${align}`);
    });

    modeManualBtn.addEventListener('click', () => switchPostGenMode('manual'));
    modeAiTopicBtn.addEventListener('click', () => switchPostGenMode('ai-topic'));
    modeAiTrendBtn.addEventListener('click', () => switchPostGenMode('ai-trend'));
    
    aiLengthSelector.addEventListener('click', (e) => {
        const button = e.target.closest('.mode-btn');
        if (button && button.dataset.length) {
            currentAiLength = button.dataset.length;
            aiLengthSelector.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });

    contentTypeSelector.addEventListener('change', (e) => {
        updateAiSuggestions(e.target.value);
    });

    generatePostsBtn.addEventListener('click', generatePosts);
    downloadAllZipBtn.addEventListener('click', () => {
        const postElements = resultsGrid.querySelectorAll('.post-template');
        if (postElements.length > 0) {
            downloadAllAsZip(Array.from(postElements), 'posts');
        } else {
            alert('No hay imágenes generadas para descargar.');
        }
    });

    // Niche system event listeners (using event delegation)
    nicheSelectorContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('niche-btn')) {
            nicheSelectorContainer.querySelectorAll('.niche-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            populateSubniches(target.dataset.niche);
            microthemeSuggestionsContainer.classList.add('hidden'); // Hide microthemes when niche changes
        }
    });

    subnicheSelector.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('subniche-btn')) {
            subnicheSelector.querySelectorAll('.subniche-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            populateMicrothemes(target.dataset.niche, target.dataset.subniche);
        }
    });
    
    microthemeSuggestions.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('microtheme-btn')) {
            const currentText = aiTopicInput.value.trim();
            const newTerm = target.textContent;
            if (currentText) {
                aiTopicInput.value = `${currentText}, ${newTerm}`;
            } else {
                aiTopicInput.value = newTerm;
            }
        }
    });


    // --- Initial Setup ---
    loadPostTemplateData();
    setActiveTemplate('facebook');
    switchPostGenMode('manual');
    updatePostFont();
    updateAiSuggestions(contentTypeSelector.value); // Set initial suggestion
    populateNiches(); // Populate the niche system
};
