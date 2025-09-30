import { getAiInstance } from '../services/api.js';

export const initTextEnhancer = () => {
    // --- Elements ---
    const originalTextInput = document.getElementById('te-original-text');
    const toneSelect = document.getElementById('te-tone-select');
    const lengthSelector = document.getElementById('te-length-selector');
    const generateBtn = document.getElementById('te-generate-btn');
    const resultsContainer = document.getElementById('te-results-container');
    const initialState = document.getElementById('te-initial-state');
    const loader = document.getElementById('te-loader');
    const generatedTextEl = document.getElementById('te-generated-text');
    const copyBtn = document.getElementById('te-copy-btn');

    // --- State ---
    let currentLength = 'media';

    // --- Functions ---
    const getToneInstruction = (toneKey) => {
        const baseInstruction = " Usa siempre un lenguaje natural, coloquial y fácil de entender, como el español que se habla en México. Evita palabras demasiado formales o rebuscadas.";
        const toneMap = {
            // Combinados
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
            // Puros
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
        return toneMap[toneKey] || 'Actúa como un copywriter experto. Escribe en un tono neutro e informativo.' + baseInstruction;
    };

    const getLengthInstruction = (lengthKey) => {
        const lengthMap = {
            'corta': 'Reescribe el texto para que sea mucho más conciso y breve, como un resumen o un tweet. Captura la idea principal en una o dos frases.',
            'media': 'Reescribe el texto manteniendo una longitud similar a la original. Puedes pulirlo, mejorar la claridad o reestructurarlo ligeramente, pero sin acortarlo o alargarlo drásticamente.',
            'larga': 'Reescribe el texto expandiendo las ideas originales. Añade más detalles, ejemplos, o utiliza un lenguaje más elaborado para hacerlo más completo y descriptivo.'
        };
        return lengthMap[lengthKey] || 'Reescribe el texto manteniendo una longitud similar a la original.';
    };

    const toggleLoading = (isLoading) => {
        loader.classList.toggle('hidden', !isLoading);
        generateBtn.disabled = isLoading || !originalTextInput.value.trim();
    };

    const enhanceText = async () => {
        const ai = getAiInstance();
        if (!ai) {
             alert('Por favor, introduce tu clave API para usar esta función.');
             return;
        }

        const originalText = originalTextInput.value.trim();
        if (!originalText) {
            alert('Por favor, introduce el texto que deseas mejorar.');
            return;
        }

        toggleLoading(true);
        initialState.style.display = 'none';
        resultsContainer.classList.add('hidden');

        const toneKey = toneSelect.value;
        const copywriterPersona = getToneInstruction(toneKey);
        const lengthInstruction = getLengthInstruction(currentLength);

        const prompt = `Tu rol es el de: ${copywriterPersona}. Tu misión es reescribir y mejorar el siguiente texto.

Sigue estas reglas estrictamente:
1. Adopta completamente el tono y la personalidad descritos en tu rol.
2. ${lengthInstruction}
3. El resultado debe ser únicamente el texto mejorado, sin añadir explicaciones, saludos, introducciones ni formato especial.

Texto original a mejorar:
"${originalText}"`;
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            generatedTextEl.textContent = response.text;
            resultsContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error al mejorar el texto:', error);
            alert('Ocurrió un error al mejorar el texto. Inténtalo de nuevo.');
            initialState.style.display = 'flex'; // Show initial state again on error
        } finally {
            toggleLoading(false);
        }
    };
    
    // --- Event Listeners ---
    originalTextInput.addEventListener('input', () => {
        generateBtn.disabled = !originalTextInput.value.trim();
    });

    lengthSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.length) {
            currentLength = button.dataset.length;
            lengthSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });

    generateBtn.addEventListener('click', enhanceText);
    
    copyBtn.addEventListener('click', () => {
        if (!generatedTextEl.textContent) return;
        navigator.clipboard.writeText(generatedTextEl.textContent).then(() => {
            const originalContent = copyBtn.innerHTML;
            copyBtn.textContent = '¡Copiado!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalContent;
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar texto: ', err);
            alert('No se pudo copiar el texto.');
        });
    });
};
