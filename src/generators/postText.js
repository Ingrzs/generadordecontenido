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
    const modeAiBtn = document.getElementById('mode-ai-btn');
    const manualInputContainer = document.getElementById('manual-input-container');
    const aiInputContainer = document.getElementById('ai-input-container');
    const aiTopicInput = document.getElementById('ai-topic');
    const aiToneSelect = document.getElementById('ai-tone');
    const aiReactionSelect = document.getElementById('ai-reaction');
    const aiLengthSelector = document.getElementById('ai-length-selector');
    const aiQuantityInput = document.getElementById('ai-quantity');
    const fontSelector = document.getElementById('post-font-selector');

    // --- State ---
    let generatedPostCanvases = [];
    let currentPostGenMode = 'manual';
    let currentAiLength = 'medio';

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
        if (mode === 'ai') {
            modeAiBtn.classList.add('active');
            modeManualBtn.classList.remove('active');
            aiInputContainer.classList.remove('hidden');
            manualInputContainer.classList.add('hidden');
            generatePostsBtn.textContent = 'Generar Contenido y Frases';
        } else {
            modeManualBtn.classList.add('active');
            modeAiBtn.classList.remove('active');
            manualInputContainer.classList.remove('hidden');
            aiInputContainer.classList.add('hidden');
            generatePostsBtn.textContent = 'Generar Frases';
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
            'pure_curious': 'Adopta un tono puramente curioso. Tu objetivo es despertar el interés y crear un gancho (hook). Usa preguntas y frases incompletas que dejen al lector queriendo saber más.' + baseInstruction,
            'pure_emotional': 'Adopta un tono puramente emocional. Tu objetivo es crear una conexión profunda y sentimental. Usa frases que exploren sentimientos universales como el dolor, el amor o la soledad.' + baseInstruction,
            'pure_critical': 'Adopta un tono puramente crítico. Tu objetivo es exponer una opinión fuerte y directa. Usa frases tajantes, juicios y declaraciones firmes sobre un tema.' + baseInstruction,
            'pure_motivational': 'Adopta un tono puramente motivacional. Tu objetivo es inspirar y empoderar al lector. Usa imperativos, frases de aliento y llamados a la acción.' + baseInstruction,
            'pure_double_meaning': 'Adopta un tono puramente de doble sentido. Tu objetivo es jugar con la ambigüedad para conectar de forma pícara. Usa insinuaciones y frases con doble lectura.' + baseInstruction,
            'pure_dramatic': 'Adopta un tono puramente dramático. Tu objetivo es impactar emocionalmente. Usa un lenguaje intenso, profundo y con carga sentimental para describir una situación.' + baseInstruction
        };
        return toneMap[toneKey] || 'Actúa como un copywriter experto en redes sociales. Escribe en un tono neutro e informativo.' + baseInstruction;
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

        const topic = aiTopicInput.value.trim();
        if (!topic) {
            throw new Error('Por favor, introduce un tema principal para la generación con IA.');
        }
        const toneKey = aiToneSelect.value;
        const reaction = aiReactionSelect.value;
        const copywriterPersona = getToneInstruction(toneKey);
        const lengthInstruction = getLengthInstruction(currentAiLength);
        const quantity = aiQuantityInput.value;

        const prompt = `${copywriterPersona}. Tu misión es crear ${quantity} frases virales para redes sociales sobre el siguiente tema: "${topic}".

Reglas estrictas:
- Formato: Las frases deben ser cortas, naturales, con estilo humano, como las que se usan en imágenes o memes.
- Longitud: Máximo ${lengthInstruction} por frase.
- Objetivo Principal: Las frases deben generar ${reaction}.
- No incluyas hashtags, números de lista, ni comillas alrededor de cada frase.

El resultado debe ser un objeto JSON que siga el esquema proporcionado, sin explicaciones adicionales.`;

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
    
    const generatePostImages = async (texts) => {
        resultsGrid.innerHTML = '';
        resultsHeader.classList.add('hidden');
        generatedPostCanvases = [];
    
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
    
        for (const [index, text] of texts.entries()) {
            const postClone = postPreviewTemplate.cloneNode(true);
            const textElement = postClone.querySelector('.post-text');
            if (textElement) {
                textElement.textContent = text;
                // Ensure font style is cloned
                textElement.style.fontFamily = postTextP.style.fontFamily;
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
            let textsToGenerate = [];

            if (currentPostGenMode === 'ai') {
                togglePostLoading(true, 'Generando textos con IA...');
                const generatedTexts = await generatePostTextsWithAI();
                textsToGenerate = generatedTexts;
            } else { // Manual mode
                textsToGenerate = postTextsInput.value.split('\n').filter(text => text.trim() !== '');
            }

            if (textsToGenerate.length === 0) {
                alert('No hay textos para generar. Por favor, escribe o genera textos primero.');
                return; // Stop execution
            }

            togglePostLoading(true, 'Generando imágenes...');
            await generatePostImages(textsToGenerate);

        } catch (error) {
            console.error("Error al generar posts:", error);
            alert(`Error: ${error.message}`);
        } finally {
            togglePostLoading(false);
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
    modeAiBtn.addEventListener('click', () => switchPostGenMode('ai'));
    
    aiLengthSelector.addEventListener('click', (e) => {
        const button = e.target.closest('.mode-btn');
        if (button && button.dataset.length) {
            currentAiLength = button.dataset.length;
            aiLengthSelector.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });

    generatePostsBtn.addEventListener('click', generatePosts);
    downloadAllZipBtn.addEventListener('click', () => {
        if (generatedPostCanvases.length > 0) {
            downloadAllAsZip(generatedPostCanvases, 'posts');
        } else {
            alert('No hay imágenes generadas para descargar.');
        }
    });

    // --- Initial Setup ---
    loadPostTemplateData();
    setActiveTemplate('facebook');
    switchPostGenMode('manual');
    updatePostFont();
};
