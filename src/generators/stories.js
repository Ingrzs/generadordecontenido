import { getAiInstance } from '../services/api.js';

export const initStoriesGenerator = () => {
    // --- Elements ---
    const topicInput = document.getElementById('st-topic');
    const modeSelector = document.getElementById('st-mode-selector');
    const dateFilterGroup = document.getElementById('st-date-filter-group');
    const dateFilterSelect = document.getElementById('st-date-filter');
    const toneSelect = document.getElementById('st-tone-select');
    const reactionSelect = document.getElementById('st-reaction-select');
    const lengthSelector = document.getElementById('st-length-selector');
    const generateBtn = document.getElementById('st-generate-btn');
    const resultsContainer = document.getElementById('st-results-container');
    const initialState = document.getElementById('st-initial-state');
    const loader = document.getElementById('st-loader');
    const generatedTextEl = document.getElementById('st-generated-text');
    const copyBtn = document.getElementById('st-copy-btn');

    // --- State ---
    let currentMode = 'chisme'; // Default to the new mode
    let currentLength = 'media';

    // --- Functions ---
    const getToneInstruction = (toneKey) => {
        const toneMap = {
            'sarcastic_humorous': 'un tono humorístico y sarcástico',
            'polemic_opinative': 'un tono polémico y opinativo',
            'ironic_critical': 'un tono irónico y crítico',
            'emotional_reflective': 'un tono emocional y reflexivo',
            'curious_emotional': 'un tono curioso que despierte intriga y termine con una conexión emocional',
            'inspiring_critical': 'un tono inspirador pero a la vez crítico y directo',
            'sarcastic_polemic': 'un tono sarcástico y provocador',
            'double_meaning_humor': 'un tono con humor de doble sentido',
            'curious_polemic': 'un tono que empiece con curiosidad y termine en polémica',
            'dramatic_emotional': 'un tono dramático y muy emocional',
            'pure_sarcastic': 'un tono puramente sarcástico',
            'pure_polemic': 'un tono puramente polémico',
            'pure_humorous': 'un tono puramente humorístico',
            'pure_ironic': 'un tono puramente irónico',
            'pure_curious': 'un tono puramente curioso y de intriga',
            'pure_emotional': 'un tono puramente emocional y sentimental',
            'pure_critical': 'un tono puramente crítico y directo',
            'pure_motivational': 'un tono puramente motivacional',
            'pure_double_meaning': 'un tono puramente de doble sentido',
            'pure_dramatic': 'un tono puramente dramático'
        };
        return toneMap[toneKey] || 'un tono neutro e informativo';
    };

    const getLengthInstruction = (lengthKey) => {
        const lengthMap = {
            'corta': 'corta',
            'media': 'de longitud media',
            'larga': 'extensa y detallada'
        };
        return lengthMap[lengthKey] || 'de longitud media';
    };

    const toggleLoading = (isLoading) => {
        loader.classList.toggle('hidden', !isLoading);
        generateBtn.disabled = isLoading;
    };

    const generateStory = async () => {
        const ai = getAiInstance();
        if (!ai) {
             alert('Por favor, introduce tu clave API para usar esta función.');
             return;
        }

        toggleLoading(true);
        initialState.style.display = 'none';
        resultsContainer.classList.add('hidden');

        let finalPrompt;
        let config = {};
        const reaction = reactionSelect.options[reactionSelect.selectedIndex].text; // Get the visible text for clarity
        const reactionValue = reactionSelect.value;
        const tone = getToneInstruction(toneSelect.value);
        const length = getLengthInstruction(currentLength);
        const topic = topicInput.value.trim();

        if (currentMode === 'chisme') {
            const topicInstruction = topic 
                ? `La confesión debe girar en torno al siguiente tema: "${topic}".`
                : "Si no se proporciona un tema, inventa uno relacionado con situaciones cotidianas y relaciones personales (familia, amigos, pareja, trabajo).";

             let structureInstruction;
            if (reactionValue.includes('empatía') || reactionValue.includes('reflexión')) {
                structureInstruction = "Crea una historia de **Dilema/Desahogo** como los ejemplos de referencia. Debe ser un relato personal detallado sobre una situación difícil, terminando con una reflexión emocional, una sensación de estar atrapado o simplemente como un desahogo para ventilar una situación.";
            } else if (reactionValue.includes('debate') || reactionValue.includes('comentarios')) {
                structureInstruction = "Crea una historia de **\"Qué Hago\"** como el ejemplo de la jefa. Debe presentar un dilema moral o social y terminar con una pregunta directa a la audiencia.";
            } else { // Risa, suspense, etc.
                structureInstruction = "Crea una historia con un **Giro Inesperado** como el ejemplo de los hermanos. Debe tener un final sorprendente, gracioso o impactante.";
            }

            finalPrompt = `Actúa como un experto en crear contenido viral de "chismes" y "confesiones anónimas" para redes sociales. Tu misión es escribir una historia ${length} en formato de confesión, inspirándote en los siguientes ejemplos para capturar el tono y la estructura perfectos.

**EJEMPLOS DE REFERENCIA (NO COPIAR, SOLO APRENDER EL ESTILO):**

*   **Ejemplo 1 - Giro Inesperado (Objetivo: Risa/Sorpresa):**
    > 🚨Confesión Anónima 🚨
    > Haz de cuenta que somos 5 hermanos y un día que nos juntamos una de mis hermanas le reviso el celular a mi papá... encontró mensajes muy fuertes con otra mujer... Fuimos a decirle a mi mamá enfrente de mi papa para que no lo negara... y resulta que esos mensajes eran de mi mamá, ellos tenían esas dinámicas para poner picor en su relación... todos los hermanos quedamos espantados y se nos quitaron las ganas de ser chismosos jajaja

*   **Ejemplo 2 - Dilema/Desahogo (Objetivo: Empatía/Reflexión):**
    > Anónimo por favor!
    > Resulta que tenía años viendo cosas que me hacían dudar de mi esposo, pero estaba sumergida en preocupaciones y tristeza por mi hijo que tiene autismo... me enteré de que andaba coqueteando con una compañera de su trabajo... Estoy en una situación muy difícil porque... mi hijo ya ha pasado por 5 escuelas y en la que esta ahora se ha adaptado mejor... A veces es muy obvio lo que se tiene que hacer pero cuando uno se encuentra inmerso en la situación todo se siente más pesado 😥

*   **Ejemplo 3 - Desahogo Personal (Objetivo: Empatía/Desahogo):**
    > 🚨Confesión Anónima🚨
    > Hace un tiempo mi ex me termino, fue muy fría la manera en que lo hizo... esa última vez que lo vi fue hace un tiempesito, recuerdo haberme quedado sola en esa banca llorando mientras el se iba... El ya me había sido infiel en 2 ocasiones pero yo por amor siempre lo perdone... Ahora, una de las últimas citas que tuve con el... me di cuenta que tenia piojitos, yo por amor no le di importancia... pero, cuando me termino... recordé lo de los piojitos y pues en ese momento estaba una con el corazón rotó en recuperación y piojosa 😭. Espero el no lea esto jaja, y si lo lee lo siento, necesitaba desahogarme 😮‍💨

*   **Ejemplo 4 - "Qué Hago" (Objetivo: Debate/Comentarios):**
    > 🚨Confesión Anónima🚨
    > La hermana de mi jefa le anda agarrando dinero de la caja del negocio, me di cuenta por pura casualidad porque la vi. No he querido decir nada porque la jefa siempre dice que su hermana es su mano derecha... pero la neta anda de uña. Creen que vale la pena decir algo, o le sigo el rollo?

**TU TAREA AHORA:**
Crea una confesión COMPLETAMENTE NUEVA Y ORIGINAL siguiendo los parámetros y reglas a continuación.

**Parámetros de Contenido:**
- **Tema:** ${topicInstruction}
- **Tono:** La narrativa debe tener ${tone}.
- **Objetivo y Estructura:** El objetivo principal es "${reaction}". Para lograrlo, ${structureInstruction}
- **Longitud:** La historia debe ser ${length}.

**Reglas de Formato y Estilo (OBLIGATORIAS):**
1.  **Encabezado:** Varía el inicio. Puedes usar "🚨Confesión Anónima 🚨", "Anónimo por favor!" o empezar directamente la historia sin ningún encabezado para que se sienta más natural.
2.  **Lenguaje:** Usa un lenguaje 100% conversacional, coloquial y natural, como si alguien le estuviera contando un chisme a un amigo. Utiliza el español que se habla comúnmente en México. Evita a toda costa un vocabulario formal o rebuscado.
3.  **Emojis:** Usa emojis de forma sutil y natural para acentuar emociones, como en los ejemplos.
4.  **Detalles Personales:** Incluye detalles pequeños, específicos y a veces un poco vergonzosos (como lo de los 'piojitos' en el ejemplo). Estos detalles hacen que la historia se sienta mucho más real y auténtica.

El resultado final debe ser únicamente el texto de la historia, sin explicaciones adicionales.`;

        } else if (currentMode === 'inventada') {
            const nicheInstruction = topic 
                ? `El contenido será para el nicho "${topic}".`
                : "Como no se especificó un tema, elige tú uno que sea emocional, humano y cercano a un público de 20 a 45 años (ejemplos: superar un miedo, la importancia de la amistad, una anécdota de viaje inesperada).";

            finalPrompt = `Actúa como un equipo experto en storytelling, marketing, neuromarketing, copywriting y psicología emocional.
Crea una historia ${length} y viral con estructura narrativa (inicio impactante, desarrollo emocional y cierre reflexivo o con giro).

${nicheInstruction}
El tono de la historia será ${tone},
y su objetivo será ${reactionSelect.value}.

**Instrucciones de Lenguaje y Estilo (MUY IMPORTANTE):**
- Tu español debe ser 100% natural, coloquial y fácil de entender, específicamente como el que se habla comúnmente en México.
- Evita a toda costa palabras rebuscadas, técnicas o demasiado formales. Usa un vocabulario que cualquiera pueda comprender.
- La narrativa debe ser emocional y cinematográfica, que enganche desde la primera línea y deje una sensación fuerte al final.
- El texto debe ser 100% listo para publicar y apto para monetización.

El resultado debe ser únicamente el texto de la historia, sin títulos, explicaciones, ni saludos.`;

        } else { // web mode
            if (!topic) {
                alert('Por favor, introduce un tema para la historia en modo "Basada en Web".');
                toggleLoading(false);
                initialState.style.display = 'flex';
                return;
            }
            
            const dateFilterValue = dateFilterSelect.value;
            let dateInstruction = '';
            switch(dateFilterValue) {
                case 'hour': dateInstruction = ' que ocurrieron en la última hora'; break;
                case 'today': dateInstruction = ' que ocurrieron hoy (en las últimas 24 horas)'; break;
                case 'yesterday': dateInstruction = ' que ocurrieron ayer'; break;
                case 'before_yesterday': dateInstruction = ' que ocurrieron antier'; break;
                case 'any': default: dateInstruction = ''; break;
            }

            finalPrompt = `Actúa como un creador de contenido experto en curiosidades y datos interesantes para redes sociales. Tu especialidad es encontrar información en la web y transformarla en posts virales, entretenidos y fáciles de leer. Debes replicar el estilo de los siguientes ejemplos.

**EJEMPLOS DE REFERENCIA (NO COPIAR, SOLO APRENDER EL ESTILO):**

*   **Ejemplo 1 - Hecho Sorprendente:**
    > Curiosidades que con suerte NO sabías. El actor Rowan Atkinson logró lo que cualquier actor soñaría, ya que su personaje de Mr. Bean es mundialmente famoso... ¿qué episodios recuerdas en realidad? Y no sería difícil ya que la serie solo tuvo una única temporada con 15 episodios, pero eran repetidos tantas veces... que parecerían temporadas completas.

*   **Ejemplo 2 - Anécdota "Detrás de Cámaras":**
    > Brad Pitt casi pierde su trabajo por culpa del final de la película? El estudio quiso cambiar el final porque lo consideraba demasiado oscuro... Pero Brad Pitt apostó por ese final y les dijo; "Si cambian el final yo me bajo del proyecto”. Por suerte dejaron ese final intacto y se convirtió en uno de los más impactantes de la historia del cine. ¿Os la imagináis con un final feliz?

*   **Ejemplo 3 - Lista de Datos:**
    > Datos curiosos que quizá no sabías sobre el cine 🎬✨
    > 1️⃣ La primera proyección pública de cine fue en París en 1895...
    > 2️⃣ El famoso rugido del león de MGM fue grabado en 1928...
    > 3️⃣ La primera película a color no fue El mago de Oz, sino Viaje a la Luna (1902)...

**TU TAREA AHORA:**
Crea un post de curiosidades COMPLETAMENTE NUEVO Y ORIGINAL sobre el tema que te daré, siguiendo el estilo de los ejemplos y las reglas a continuación.

**Proceso Obligatorio:**
1.  **Investigación:** Realiza una búsqueda en Google sobre "${topic}"${dateInstruction}. Busca datos curiosos, hechos poco conocidos, historias detrás de cámaras, anécdotas o estadísticas sorprendentes.
2.  **Creación de Contenido:** Basado en lo que encuentres, redacta un post. Puedes usar diferentes formatos según lo que se ajuste mejor: un relato de una anécdota (como el de Brad Pitt), una lista de datos curiosos (como el de 'Datos curiosos del cine'), o una explicación de un hecho sorprendente (como el de Mr. Bean). A veces, puedes terminar con una pregunta para fomentar la interacción.

**Reglas del Post:**
- **Tono:** La narrativa debe tener ${tone}.
- **Longitud:** El post debe ser de longitud ${length}.
- **Objetivo:** El post debe ${reactionSelect.value}.
- **Idioma y Estilo (CRÍTICO):** Usa un español 100% natural, coloquial y conversacional, como el que se habla en México. El post debe ser entretenido, no un reporte académico.
- **Formato:** El resultado debe ser únicamente el texto del post, sin títulos, explicaciones, saludos o listas de fuentes.`;
            config.tools = [{ googleSearch: {} }];
        }
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: finalPrompt,
                config,
            });

            generatedTextEl.textContent = response.text;
            resultsContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error al generar la historia:', error);
            alert('Ocurrió un error al generar la historia. Inténtalo de nuevo.');
            initialState.style.display = 'flex';
        } finally {
            toggleLoading(false);
        }
    };
    
    // --- Event Listeners ---
    topicInput.addEventListener('input', () => {
        // In web mode, a topic is required. In other modes, it's optional.
        if (currentMode === 'web') {
            generateBtn.disabled = !topicInput.value.trim();
        } else {
            generateBtn.disabled = false;
        }
    });

    modeSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.mode) {
            currentMode = button.dataset.mode;
            modeSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show/hide date filter based on mode
            dateFilterGroup.classList.toggle('hidden', currentMode !== 'web');

            // Re-evaluate button disabled state when mode changes
            if (currentMode === 'web') {
                generateBtn.disabled = !topicInput.value.trim();
                topicInput.labels[0].textContent = "Tema de la Historia";
                topicInput.placeholder = "Ej: Película 'Seven', Mr. Bean...";
            } else {
                generateBtn.disabled = false;
                 topicInput.labels[0].textContent = "Tema de la Historia (o dejar en blanco)";
                 topicInput.placeholder = "Ej: Superar un miedo (opcional)...";
            }
        }
    });

    lengthSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.length) {
            currentLength = button.dataset.length;
            lengthSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });

    generateBtn.addEventListener('click', generateStory);
    
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

    // Initial State Setup
    generateBtn.disabled = false; // Enabled by default for "inventada" and "chisme" modes
};
