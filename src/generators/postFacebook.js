

import { getAiInstance } from '../services/api.js';

export const initFacebookPostGenerator = () => {
    const personNameInput = document.getElementById('fb-person-name');
    const yearSelect = document.getElementById('fb-year-select');
    const monthSelect = document.getElementById('fb-month-select');
    const daySelect = document.getElementById('fb-day-select');
    const dateError = document.getElementById('fb-date-error');
    const toneSelect = document.getElementById('fb-tone-select');
    const lengthSelector = document.getElementById('fb-length-selector');
    const generateBtn = document.getElementById('fb-generate-btn');
    const resultsContainer = document.getElementById('fb-results-container');
    const initialState = document.getElementById('fb-initial-state');
    const loader = document.getElementById('fb-loader');
    const generatedTextEl = document.getElementById('fb-generated-text');
    const sourcesListEl = document.getElementById('fb-sources-list');
    const copyBtn = document.getElementById('fb-copy-btn');
    const copyBtnIcon = copyBtn.querySelector('svg');
    const copyBtnText = 'Copiar';

    // New date filter elements
    const dateModeSelector = document.getElementById('fb-date-mode-selector');
    const quickDateFiltersContainer = document.getElementById('fb-quick-date-filters');
    const specificDateFiltersContainer = document.getElementById('fb-specific-date-filters');
    const quickDateSelect = document.getElementById('fb-quick-date-select');


    let currentLength = 'media';

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
            'pure_curious': 'Adopta un tono puramente curioso. Tu objetivo es despertar el interés y crear un gancho (hook). Usa preguntas o frases incompletas que dejen al lector queriendo saber más.' + baseInstruction,
            'pure_emotional': 'Adopta un tono puramente emocional. Tu objetivo es crear una conexión profunda y sentimental. Usa frases que exploren sentimientos universales como el dolor, el amor o la soledad.' + baseInstruction,
            'pure_critical': 'Adopta un tono puramente crítico. Tu objetivo es exponer una opinión fuerte y directa. Usa frases tajantes, juicios y declaraciones firmes sobre un tema.' + baseInstruction,
            'pure_motivational': 'Adopta un tono puramente motivacional. Tu objetivo es inspirar y empoderar al lector. Usa imperativos, frases de aliento y llamados a la acción.' + baseInstruction,
            'pure_double_meaning': 'Adopta un tono puramente de doble sentido. Tu objetivo es jugar con la ambigüedad para conectar de forma pícara. Usa insinuaciones y frases con doble lectura.' + baseInstruction,
            'pure_dramatic': 'Adopta un tono puramente dramático. Tu objetivo es impactar emocionalmente. Usa un lenguaje intenso, profundo y con carga sentimental para describir una situación.' + baseInstruction
        };
        return toneMap[toneKey] || 'Actúa como un copywriter experto en redes sociales. Escribe en un tono neutro e informativo.' + baseInstruction;
    };

    const populateDateFilters = () => {
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '<option value="">Año</option>';
        for (let year = currentYear; year >= currentYear - 20; year--) {
            yearSelect.add(new Option(year, year));
        }

        monthSelect.innerHTML = '<option value="">Mes</option>';
        for (let month = 1; month <= 12; month++) {
            const monthName = new Date(currentYear, month - 1, 1).toLocaleString('es-ES', { month: 'long' });
            monthSelect.add(new Option(monthName.charAt(0).toUpperCase() + monthName.slice(1), month));
        }
        
        daySelect.innerHTML = '<option value="">Día</option>';
        for (let day = 1; day <= 31; day++) {
            daySelect.add(new Option(day, day));
        }
    };
    
    const validateDate = () => {
        const year = parseInt(yearSelect.value, 10);
        const month = parseInt(monthSelect.value, 10);
        const day = parseInt(daySelect.value, 10);
        
        if (year && month && day) {
            const selectedDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // Set to end of today

            if (selectedDate > today) {
                dateError.classList.remove('hidden');
                return false;
            }
        }
        dateError.classList.add('hidden');
        return true;
    };

    const toggleLoading = (isLoading) => {
        loader.classList.toggle('hidden', !isLoading);
        generateBtn.disabled = isLoading || !personNameInput.value.trim();
    };

    const generatePost = async () => {
        const ai = getAiInstance();
        if (!ai) {
             alert('Por favor, introduce tu clave API para generar el post.');
             return;
        }

        const person = personNameInput.value.trim();
        if (!person) {
            alert('Por favor, introduce el nombre de la figura pública.');
            return;
        }

        toggleLoading(true);
        initialState.style.display = 'none';
        resultsContainer.classList.add('hidden');

        let dateFilter = '';
        const activeModeButton = dateModeSelector.querySelector('button.active');
        const mode = activeModeButton ? activeModeButton.dataset.mode : 'quick';

        if (mode === 'specific') {
            if (!validateDate()) {
                toggleLoading(false);
                return;
            }
            if (yearSelect.value) dateFilter += ` del año ${yearSelect.value}`;
            if (monthSelect.value) dateFilter += ` del mes ${monthSelect.value}`;
            if (daySelect.value) dateFilter += ` del día ${daySelect.value}`;
        } else { // 'quick' mode
            const quickFilterValue = quickDateSelect.value;
            switch(quickFilterValue) {
                case 'hour': dateFilter = ' de la última hora'; break;
                case '4hours': dateFilter = ' de las últimas 4 horas'; break;
                case '24hours': dateFilter = ' de las últimas 24 horas'; break;
                case '48hours': dateFilter = ' de las últimas 48 horas'; break;
                case '7days': dateFilter = ' de los últimos 7 días'; break;
                case 'any': default: dateFilter = ''; break;
            }
        }

        const toneInstruction = getToneInstruction(toneSelect.value);

        const prompt = `
Tu rol es el de un copywriter experto y estratega de redes sociales. Tu objetivo es crear un post de Facebook para una página de noticias o un blog que informa sobre figuras públicas.

Sigue estos pasos rigurosamente:

Paso 1: Investigación.
- Realiza una búsqueda en Google sobre noticias, eventos o hechos importantes y recientes sobre "${person}"${dateFilter}.
- Enfócate en UN solo suceso clave y relevante para basar el post.

Paso 2: Redacción del Post.
- Analiza la información encontrada y, aplicando estrictamente las siguientes instrucciones de personalidad y tono, redacta el post:
- **Instrucción de Tono/Personalidad:** "${toneInstruction}"
- El post debe estar escrito en tercera persona (hablando *sobre* la figura pública) o de forma impersonal, como lo haría una página de noticias.
- **REGLA FUNDAMENTAL: NUNCA escribas en primera persona como si fueras "${person}".**
- Aplica los siguientes parámetros adicionales:
    - Longitud: ${currentLength}.
    - Idioma: Español.
- El resultado final debe ser únicamente el texto del post. No incluyas títulos como "Post de Facebook:" ni explicaciones.`;
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            generatedTextEl.textContent = response.text;
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            sourcesListEl.innerHTML = '';
            if (groundingChunks && groundingChunks.length > 0) {
                 groundingChunks.forEach(chunk => {
                    const uri = chunk.web?.uri;
                    const title = chunk.web?.title || uri;
                    if (uri) {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.href = uri;
                        a.textContent = title;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        li.appendChild(a);
                        sourcesListEl.appendChild(li);
                    }
                });
            } else {
                sourcesListEl.innerHTML = '<li>No se encontraron fuentes específicas.</li>';
            }

            resultsContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error generando post de Facebook:', error);
            alert('Ocurrió un error al generar el post. Inténtalo de nuevo.');
            initialState.style.display = 'flex'; // Show initial state again on error
        } finally {
            toggleLoading(false);
        }
    };
    
    // --- Event Listeners ---
    personNameInput.addEventListener('input', () => {
        generateBtn.disabled = !personNameInput.value.trim();
    });
    
    [yearSelect, monthSelect, daySelect].forEach(el => el.addEventListener('change', validateDate));

    lengthSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.length) {
            currentLength = button.dataset.length;
            lengthSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });

    dateModeSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            const mode = button.dataset.mode;
            dateModeSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const isQuickMode = mode === 'quick';
            quickDateFiltersContainer.classList.toggle('hidden', !isQuickMode);
            specificDateFiltersContainer.classList.toggle('hidden', isQuickMode);
            if(isQuickMode) {
                dateError.classList.add('hidden'); // Hide specific date error when switching
            }
        }
    });

    generateBtn.addEventListener('click', generatePost);
    
    copyBtn.addEventListener('click', () => {
        if (!generatedTextEl.textContent) return;
        navigator.clipboard.writeText(generatedTextEl.textContent).then(() => {
            copyBtn.textContent = '';
            copyBtn.appendChild(document.createTextNode('¡Copiado!'));
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.textContent = '';
                if(copyBtnIcon) copyBtn.appendChild(copyBtnIcon.cloneNode(true));
                copyBtn.appendChild(document.createTextNode(copyBtnText));
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar texto: ', err);
            alert('No se pudo copiar el texto.');
        });
    });

    // --- Init ---
    populateDateFilters();
};
