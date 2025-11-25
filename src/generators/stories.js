import { getAiInstance } from '../services/api.js';

export const initStoriesGenerator = () => {
    // --- Elements ---
    const topicInput = document.getElementById('st-topic');
    const modeSelector = document.getElementById('st-mode-selector');
    const structureGroup = document.getElementById('st-structure-group');
    const structureSelector = document.getElementById('st-structure-selector');
    
    // Web-based mode controls
    const webModeControls = document.getElementById('st-web-mode-controls');
    const nicheSelect = document.getElementById('st-niche-select');
    const storyAngleSelect = document.getElementById('st-story-angle-select');
    const dateFilterGroup = document.getElementById('st-date-filter-group');
    const dateFilterSelect = document.getElementById('st-date-filter');

    // Generic controls
    const genericToneGroup = document.getElementById('st-generic-tone-group');
    const toneSelect = document.getElementById('st-tone-select');
    const reactionSelect = document.getElementById('st-reaction-select');
    const lengthSelector = document.getElementById('st-length-selector');
    const generateBtn = document.getElementById('st-generate-btn');
    const resultsContainer = document.getElementById('st-results-container');
    const initialState = document.getElementById('st-initial-state');
    const loader = document.getElementById('st-loader');
    const generatedTextEl = document.getElementById('st-generated-text');
    const copyBtn = document.getElementById('st-copy-btn');
    const sourcesCard = document.querySelector('.st-sources-card');
    const sourcesListEl = document.getElementById('st-sources-list');
    const imageStyleSelector = document.getElementById('st-image-style-selector');
    const imagePromptCard = document.getElementById('st-image-prompt-card');
    const generatedPromptEl = document.getElementById('st-generated-prompt');
    const copyPromptBtn = document.getElementById('st-copy-prompt-btn');


    // --- State ---
    let currentMode = 'chisme';
    let currentStructure = 'dilema_consejo';
    let currentLength = 'media';
    let currentImageStyle = 'realista';
    let lastGeneratedStory = ''; // To request a different story on the same topic
    let lastTopic = ''; // To track the last used topic

    const webStoryAngles = {
        fama_lujos: [
            { value: 'pobreza_riqueza', text: 'De la Pobreza a la Riqueza (o Viceversa)' },
            { value: 'detras_exito', text: 'Detrás del Éxito (Entrevista / Confesión)' },
            { value: 'lado_oscuro', text: 'El Lado Oscuro de la Fama (Polémicas)' },
            { value: 'anecdota_inspiradora', text: 'Anécdota Inspiradora / Lección de Vida' },
            { value: 'dato_curioso', text: 'Dato Curioso / Secreto Revelado' }
        ],
        cinefilo_curioso: [
            { value: 'detras_camaras', text: 'Detrás de Cámaras (Secretos de Filmación)' },
            { value: 'casting_alternativo', text: 'El Papel que Casi Fue (Casting Alternativo)' },
            { value: 'transformacion_actor', text: 'La Transformación del Actor' },
            { value: 'historia_real', text: 'La Historia Real detrás de la Película' },
            { value: 'easter_eggs', text: 'Detalles Ocultos / Easter Eggs' }
        ],
        mundo_curioso: [
            { value: 'animales_sorprendentes', text: 'Animales sorprendentes' },
            { value: 'misterios_reales', text: 'Misterios reales' },
            { value: 'coincidencias_increibles', text: 'Coincidencias increíbles' },
            { value: 'curiosidades_historicas', text: 'Curiosidades históricas' },
            { value: 'ciencia_curiosa', text: 'Ciencia curiosa del día a día' },
            { value: 'cultura_tradiciones', text: 'Cultura y tradiciones extrañas del mundo' },
            { value: 'naturaleza_extrema', text: 'Naturaleza extrema' },
            { value: 'tecnologia_sorprendente', text: 'Tecnología sorprendente' },
            { value: 'historias_humanas', text: 'Historias humanas reales y emocionantes' },
            { value: 'hechos_absurdos', text: 'Hechos absurdos del mundo' }
        ]
    };

    // --- NEW: Strategy Map for Suggestions ---
    const storyStrategyMap = {
        'desahogo': {
            tone: 'dramatic_emotional',
            reaction: 'generar empatía y ser compartida'
        },
        'chisme_anecdota': {
            tone: 'sarcastic_humorous',
            reaction: 'hacer reír y entretener'
        },
        'dilema_consejo': {
            tone: 'emotional_reflective',
            reaction: 'provocar debate y comentarios'
        },
        // Defaults for other modes
        'inventada': {
            tone: 'emotional_reflective',
            reaction: 'provocar una reflexión profunda'
        },
        'web': { // This is a fallback, the new system is more specific
            tone: 'curious_emotional',
            reaction: 'crear suspense y curiosidad'
        }
    };


    // --- Functions ---
    const populateStoryAngles = () => {
        const niche = nicheSelect.value;
        const angles = webStoryAngles[niche] || [];
        storyAngleSelect.innerHTML = '';
        angles.forEach(angle => {
            const option = document.createElement('option');
            option.value = angle.value;
            option.textContent = angle.text;
            storyAngleSelect.appendChild(option);
        });
    };

    const updateStorySuggestions = (type) => {
        const strategy = storyStrategyMap[type];
        if (strategy) {
            toneSelect.value = strategy.tone;
            reactionSelect.value = strategy.reaction;
        }
    };

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
        sourcesCard.classList.add('hidden');
        imagePromptCard.classList.add('hidden');


        let finalPrompt;
        let config = {};
        const reactionValue = reactionSelect.value;
        const length = getLengthInstruction(currentLength);
        const topic = topicInput.value.trim();

        if (currentMode === 'chisme') {
            const tone = getToneInstruction(toneSelect.value);
            const topicInstruction = topic 
                ? `La confesión debe girar en torno al siguiente tema: "${topic}".`
                : "Si no se proporciona un tema, inventa uno relacionado con situaciones cotidianas y relaciones personales (familia, amigos, pareja, trabajo).";

            let structureInstruction;
            switch (currentStructure) {
                case 'dilema_consejo':
                    structureInstruction = "debes generar una historia con la estructura de **Dilema / Pide Consejo**. Presenta un problema personal o de relación de forma clara, describe el conflicto o la duda que genera, y finaliza con una pregunta directa a la audiencia buscando consejo, validación o diferentes puntos de vista (ej: ¿Qué hago?, ¿Estoy exagerando?, ¿Les ha pasado?).";
                    break;
                case 'chisme_anecdota':
                    structureInstruction = "debes generar una historia con la estructura de **Chisme / Anécdota**. La narrativa debe tener un giro final inesperado, sorprendente, gracioso o impactante que sea el punto central del relato.";
                    break;
                case 'desahogo':
                    structureInstruction = "debes generar una historia con la estructura de **Desahogo Personal**. El relato debe centrarse en expresar un sentimiento profundo, una frustración o una experiencia personal significativa, con el objetivo de ventilar la emoción, sin necesariamente buscar un consejo o tener un giro final.";
                    break;
                default:
                    structureInstruction = "debes generar una historia con la estructura de **Dilema / Pide Consejo**.";
            }

            finalPrompt = `Actúa como un experto en crear contenido viral de "chismes" y "confesiones anónimas" para redes sociales. Tu misión es escribir una historia ${length} en formato de confesión anónima.

**REGLA DE TONO FUNDAMENTAL:**
Cuando la historia trate temas delicados o conflictos (infidelidades, menosprecios, problemas familiares), describe la situación y los sentimientos de forma clara y directa, pero siempre con un lenguaje respetuoso y apto para todo público. Transforma lenguaje ofensivo en la descripción de la *acción* o el *sentimiento*, sin usar palabras explícitas.

**EJEMPLOS DE REFERENCIA (APRENDE EL ESTILO DE CADA ESTRUCTURA):**

*   **Ejemplo Estructura 1 - Dilema / Pide Consejo (Busca interacción y debate):**
    > Anónimo por favor. Mi esposo se molesta cuando le pido que cuide de los niños, dice que es únicamente mi responsabilidad. No sé cómo hacerlo cambiar de opinión. Dice no tener tiempo para ellos, pero cuando descansa sale con sus amigos a beber y me deja sola. Me estoy comenzando a hartar. ¿Qué harían en mi lugar?

*   **Ejemplo Estructura 2 - Chisme / Anécdota (Busca sorpresa, risa o impacto):**
    > 🚨Confesión Anónima🚨 Haz de cuenta que somos 5 hermanos y un día que nos juntamos, una de mis hermanas le revisó el celular a mi papá... encontró mensajes muy fuertes con otra mujer... Fuimos a decirle a mi mamá enfrente de mi papá para que no lo negara... y resulta que esos mensajes eran de mi mamá, ellos tenían esas dinámicas para ponerle picor a su relación... todos los hermanos quedamos espantados y se nos quitaron las ganas de ser chismosos jajaja

*   **Ejemplo Estructura 3 - Desahogo Personal (Busca empatía y ser compartido):**
    > Mi ex pareja me terminó sin razón aparente, y a la semana ya andaba con otra persona. Lo que más me dolió es que esa persona salió embarazada mientras aún nos veíamos. Todavía me duele mucho y no sé cómo superarlo del todo. Solo necesitaba contarlo.

**TU TAREA AHORA:**
Crea una confesión COMPLETAMENTE NUEVA Y ORIGINAL que siga los parámetros y reglas a continuación.

**Parámetros de Contenido:**
- **Tema:** ${topicInstruction}
- **Tono:** La narrativa debe tener ${tone}.
- **Objetivo y Estructura:** El objetivo principal es "${reactionValue}". Para lograrlo, ${structureInstruction}
- **Longitud:** La historia debe ser ${length}.

**Reglas de Formato y Estilo (OBLIGATORIAS):**
1.  **Encabezado:** Puedes usar "🚨Confesión Anónima 🚨", "Anónimo por favor!" o empezar directamente la historia sin ningún encabezado para que se sienta más natural.
2.  **Lenguaje:** Usa un lenguaje 100% conversacional, coloquial y natural, como si alguien le estuviera contando un chisme a un amigo. Utiliza el español que se habla comúnmente en México. Evita a toda costa un vocabulario formal o rebuscado.
3.  **Emojis:** Usa emojis de forma sutil y natural para acentuar emociones, como en los ejemplos.

El resultado final debe ser únicamente el texto de la historia, sin explicaciones adicionales.`;

        } else if (currentMode === 'inventada') {
            const tone = getToneInstruction(toneSelect.value);
            const nicheInstruction = topic 
                ? `El contenido será para el nicho "${topic}".`
                : "Como no se especificó un tema, elige tú uno que sea emocional, humano y cercano a un público de 20 a 45 años (ejemplos: superar un miedo, la importancia de la amistad, una anécdota de viaje inesperada).";

            finalPrompt = `Actúa como un equipo experto en storytelling, marketing, neuromarketing, copywriting y psicología emocional.
Crea una historia ${length} y viral con estructura narrativa (inicio impactante, desarrollo emocional y cierre reflexivo o con giro).

${nicheInstruction}
El tono de la historia será ${tone},
y su objetivo será ${reactionValue}.

**Instrucciones de Lenguaje y Estilo (MUY IMPORTANTE):**
- Tu español debe ser 100% natural, coloquial y fácil de entender, específicamente como el que se habla comúnmente en México.
- Evita a toda costa palabras rebuscadas, técnicas o demasiado formales. Usa un vocabulario que cualquiera pueda comprender.
- La narrativa debe ser emocional y cinematográfica, que enganche desde la primera línea y deje una sensación fuerte al final.
- El texto debe ser 100% listo para publicar y apto para monetización.

El resultado debe ser únicamente el texto de la historia, sin títulos, explicaciones, ni saludos.`;

        } else { // web mode
            const niche = nicheSelect.value;
            const angle = storyAngleSelect.value;

            if (niche === 'mundo_curioso') {
                const angleText = storyAngleSelect.options[storyAngleSelect.selectedIndex].text;
                const specificTopic = topic ? topic : "Un caso real y viral reciente";
                
                let varietyInstruction = '';
                if (topic && topic.toLowerCase() === lastTopic.toLowerCase() && lastGeneratedStory) {
                    varietyInstruction = `
IMPORTANTE: Ya me contaste una historia sobre este tema. Ahora, busca y cuéntame una anécdota o un dato COMPLETAMENTE DIFERENTE sobre el mismo tema si es posible, o sobre otro relacionado dentro del mismo nicho.`;
                }

                finalPrompt = `Actúa como el redactor principal de la página viral "Mundo Curioso".
Genera una historia larga, escrita como publicación de Facebook para una página llamada Mundo Curioso. La historia debe ser atrapante desde la primera línea, fácil de leer, con un tono misterioso, emocional, sorprendente o reflexivo según el nicho elegido. No uses lenguaje técnico; hazlo accesible y humano.

Quiero que la historia esté basada en el siguiente nicho: ${angleText}, y que el tema principal sea: ${specificTopic}.

**Instrucciones de Investigación:**
1. Realiza una búsqueda en Google para encontrar información veraz y sorprendente sobre este tema.
2. No inventes datos científicos falsos; si es un misterio, deja elementos en duda pero basados en reportes reales.

**Estructura OBLIGATORIA:**
1. **Hook fuerte** que atrape en la primera frase (con emojis).
2. **Breve contexto** de la situación, persona, animal o suceso.
3. **Detalle de lo que ocurrió:** emociones, sensaciones, hechos curiosos o misteriosos.
4. **Momento clave** que cause sorpresa, duda, miedo, ternura o reflexión.
5. **Cierre con mensaje**, moraleja o pregunta final para generar comentarios.

**Reglas de Estilo:**
- Longitud: mínimo 5–7 párrafos.
- Estilo claro, directo, emocional y muy compartible.
- Usa un lenguaje que conecte emocionalmente, estilo ‘historia que te deja pensando’.
- Al final añade una pregunta polémica o reflexiva para aumentar el engagement.
${varietyInstruction}

El resultado final debe ser únicamente el texto de la historia.`;
                
                config = { tools: [{ googleSearch: {} }] };

            } else {
                // Logic for fame/luxury and cinephile niches
                let topicInstruction;
                if (topic) {
                    topicInstruction = `sobre el tema: "${topic}"`;
                } else {
                    topicInstruction = `sobre un tema aleatorio que elijas y que sea relevante para el nicho y ángulo seleccionados. ¡Sorpréndeme!`;
                }
    
                let nicheContextInstruction;
                let angleInstruction;
                
                if (niche === 'fama_lujos') {
                    nicheContextInstruction = "Tu investigación y narrativa deben centrarse en la vida personal o profesional de la celebridad o figura pública.";
                    switch (angle) {
                        case 'pobreza_riqueza': angleInstruction = "Busca y narra historias sobre sus orígenes humildes, cómo consiguieron su fortuna, o si tuvieron reveses económicos importantes."; break;
                        case 'detras_exito': angleInstruction = "Busca fragmentos de entrevistas o anécdotas donde revelen un secreto, un sacrificio o un momento clave de su carrera."; break;
                        case 'lado_oscuro': angleInstruction = "Enfócate en buscar escándalos, momentos controversiales o las dificultades que enfrentaron por ser famosos."; break;
                        case 'anecdota_inspiradora': angleInstruction = "Busca historias donde hayan superado un obstáculo personal (no económico) y hayan dejado una enseñanza."; break;
                        case 'dato_curioso': angleInstruction = "Busca hechos poco conocidos, talentos ocultos o detalles sorprendentes sobre su vida."; break;
                    }
                } else { // cinefilo_curioso
                     nicheContextInstruction = "Tu investigación y narrativa deben centrarse en el contexto de la producción de la película, serie o en la actuación de los involucrados.";
                    switch (angle) {
                        case 'detras_camaras': angleInstruction = "Busca anécdotas sobre la producción de la película, improvisaciones de actores, problemas en el set o cómo se filmó una escena icónica."; break;
                        case 'casting_alternativo': angleInstruction = "Busca qué otros actores famosos fueron considerados para un papel principal y por qué no lo obtuvieron."; break;
                        case 'transformacion_actor': angleInstruction = "Enfócate en el increíble cambio físico o mental que un actor tuvo que hacer para un papel específico."; break;
                        case 'historia_real': angleInstruction = "Busca los hechos verídicos o las personas reales que inspiraron la trama de la película o serie."; break;
                        case 'easter_eggs': angleInstruction = "Busca referencias escondidas, cameos o 'easter eggs' dentro de la película que los fans podrían haber pasado por alto."; break;
                    }
                }
    
                let varietyInstruction = '';
                if (topic && topic.toLowerCase() === lastTopic.toLowerCase() && lastGeneratedStory) {
                    varietyInstruction = `
    IMPORTANTE: Ya me contaste una historia sobre este tema. Ahora, busca y cuéntame una anécdota o un dato COMPLETAMENTE DIFERENTE. No repitas la siguiente historia:
    ---
    ${lastGeneratedStory}
    ---
    `;
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
    
                finalPrompt = `Actúa como un storyteller experto y creador de contenido viral para redes sociales. Tu especialidad es transformar información de la web en relatos cortos y cautivadores.
    
    **TAREA PRINCIPAL:**
    1.  **Investiga:** Realiza una búsqueda exhaustiva en Google ${topicInstruction}${dateInstruction}.
    2.  **Enfócate:** ${nicheContextInstruction}
    3.  **Aplica el Ángulo:** ${angleInstruction}
    4.  **Crea un Relato:** Basado en la información más interesante que encuentres, escribe una historia original que siga el estilo y formato de los ejemplos de referencia.
    ${varietyInstruction}
    **EJEMPLOS DE REFERENCIA (ESTILO A IMITAR OBLIGATORIAMENTE):**
    *   > 🎭 “El día que cambiaron a Marty McFly, pensé que no podría hacerlo otra vez.”
        > "Cuando empezamos a filmar Back to the Future, había otro actor interpretando a Marty: Eric Stoltz. Rodamos durante seis semanas enteras con él. Una noche, a la 1 de la mañana, nos llamaron a todos los del elenco a un tráiler. Ahí estaba Spielberg. Nos anunció que Stoltz salía del proyecto, y que entrarían con Michael J. Fox. Yo me quedé helado. Había trabajado tanto en encontrar el ritmo de Doc, en conectar con esa energía, que pensé: “No voy a poder hacerlo otra vez.” Pero en cuanto Michael llegó, todo fluyó. Desde la primera escena, hubo una química instantánea, natural, sin esfuerzo. A veces, los grandes cambios que más miedo dan… son justo los que terminan salvando una historia."
        > 🎬 Christopher Lloyd sobre el reemplazo de Eric Stoltz por Michael J. Fox en Back to the Future.
    *   > 😢🎙“Antes de entrar a La Academia vivía en una bodega prestada porque mi departamento se había incendiado. No podía ni bañarme. Yo era un cantante de bares. Todo cambió cuando el casting de La Academia se realizó justo arriba de uno de los bares donde yo cantaba. Mis amigos me insistieron en que fuera… lo hice, y mi vida cambió para siempre.”
        > "Entré a La Academia en 2002, pero no fue una historia normal. Unas semanas antes mi vida se había incendiado… literalmente. El departamento donde vivía con mi hijo Tristan, en Playas de Tijuana, se quemó por completo. Nos quedamos sin nada: sin ropa, sin instrumentos, sin un techo. Dormía donde podía, y un amigo me prestó una bodega para vivir. Ahí puse una alfombra, unas cajas de madera como burós y un colchón inflable. Me bañaba en casa de amigos, y usaba los baños de un bar abierto 24 horas frente a la Revolución. Fue una etapa durísima, pero seguía con la fe de que algo bueno iba a pasar.”
        > 👉 Yahir sobre cómo, tras perderlo todo en un incendio, terminó entrando a La Academia sin haber sido seleccionado oficialmente.
    
    **REGLAS DE FORMATO Y ESTILO (MUY ESTRUCTURADO):**
    1.  **Inicio (Hook):** Comienza siempre con un emoji relevante seguido de una frase corta, impactante y entre comillas que sirva como gancho. Ejemplo: \`🎭 “El día que cambiaron a Marty McFly...”\`
    2.  **Cuerpo del Relato:**
        *   Desarrolla la historia en párrafos cortos y fáciles de leer.
        *   Usa un lenguaje 100% conversacional, coloquial y natural (español de México).
        *   Integra emojis de forma natural para añadir emoción y contexto visual.
        *   Enfócate en el aspecto humano o sorprendente del dato que encontraste. Transforma la información en una narrativa personal y emocional.
    3.  **Cierre (Atribución):** Termina siempre la historia con una línea de atribución que siga este formato: \`[Emoji] [Nombre de la persona o fuente] sobre [breve descripción del contexto]\`. Ejemplo: \`🎬 Christopher Lloyd sobre el reemplazo de Eric Stoltz...\`
    4.  **Parámetros Adicionales:**
        *   La historia debe ser ${length}.
        *   El objetivo es ${reactionValue}.
    
    **SALIDA FINAL:**
    El resultado final debe ser únicamente el texto de la historia, siguiendo todas las reglas de formato, sin añadir explicaciones, títulos o saludos.`;
                config = { tools: [{ googleSearch: {} }] };
            }
        }

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: finalPrompt,
                config: config,
            });

            const newStory = response.text;
            generatedTextEl.textContent = newStory;

            // Update state for variety
            lastGeneratedStory = newStory;
            lastTopic = topic;
            
            // --- NEW: Generate Image Prompt ---
            if (currentMode === 'inventada' || currentMode === 'chisme') {
                loader.querySelector('p').textContent = 'Generando prompt para imagen...';
                
                const toneDescription = toneSelect.options[toneSelect.selectedIndex].text;
                const imageStyle = currentImageStyle === 'animado' ? 'Animated / Comic' : (currentImageStyle === 'anime' ? 'Anime' : 'Realistic');

                const imagePromptInstruction = `
                **ROLE: "Narrative Visual Generator"**

                You are an expert AI specializing in creating descriptive image prompts for viral micro-stories and confessions. Your task is to analyze the provided story and its NARRATIVE TONE, then generate a single, concise, and highly descriptive image prompt in ENGLISH, suitable for AI image generators like Midjourney or DALL-E.

                **VISUAL INTERPRETATION GUIDE (Based on Narrative Tone):**
                - **Sarcastic + Humorous / Double Meaning + Humor:** Generate a prompt for a realistic photo with exaggerated gestures or comical everyday situations. Bright lighting. (e.g., "Man laughing nervously looking at his phone as if hiding something.")
                - **Polemic + Opinionated / Curious + Polemic / Sarcastic + Polemic:** Generate a prompt for a cinematic realistic style, with confident or defiant expressions. Urban or modern indoor backgrounds. (e.g., "Person looking directly at the camera with a challenging gesture, blurred city background.")
                - **Ironic + Critical / Inspiring + Critical:** Generate a prompt for a natural photographic style, with a reflective or cynical gaze. Neutral or warm colors. (e.g., "Thoughtful woman in a coffee shop, sarcastic expression, warm tone.")
                - **Emotional + Reflective / Dramatic + Emotional:** Generate a prompt for a cinematic realistic photo, dim light, intimate or nostalgic atmosphere. (e.g., "Woman looking out the window while it rains, melancholic expression.")
                - **Curious + Emotional / Motivational:** Generate a prompt for a realistic style with a poetic touch or semi-realistic anime. Soft colors and diffuse light. (e.g., "Young girl looking at the sunset sky, hopeful air.")
                - **Purely Critical / Polemic / Ironic:** Generate a prompt for expressive faces with a fixed gaze or a gesture of disapproval. Minimalist background. (e.g., "Man with a raised eyebrow and a sarcastic smile, neutral background.")
                - **Purely Humorous / Double Meaning:** Generate a prompt for everyday scenes with a comic or spicy touch. Warm or daylight. (e.g., "Surprised woman in the kitchen holding her cell phone, amused expression.")
                - **Purely Dramatic / Emotional:** Generate a prompt for portraits with emotional intensity, tears, soft shadows. (e.g., "Woman crying discreetly, dark background, dim realistic light.")

                **TASK:**
                1. Analyze the story and the provided narrative tone.
                2. Use the guide above to interpret the tone visually.
                3. Create a descriptive prompt for a 9:16 vertical image. The prompt should be in ENGLISH.

                **SELECTED IMAGE STYLE:**
                The final prompt must be tailored to the following style: "${imageStyle}".

                **STRICT OUTPUT RULES:**
                - The output must be ONLY the text of the prompt.
                - DO NOT include any explanations, greetings, or the word "Prompt:".

                ---
                **STORY TO ANALYZE:**
                "${newStory}"
                ---
                **NARRATIVE TONE TO APPLY:**
                "${toneDescription}"
                ---
                `;

                const promptResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: imagePromptInstruction,
                });

                const imagePrompt = promptResponse.text.trim();
                generatedPromptEl.textContent = imagePrompt;
                imagePromptCard.classList.remove('hidden');
            }


            if (currentMode === 'web') {
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
                    sourcesCard.classList.remove('hidden');
                }
            }
            resultsContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error al generar la historia:', error);
            alert('Ocurrió un error al generar la historia. Inténtalo de nuevo.');
            initialState.style.display = 'flex';
        } finally {
            toggleLoading(false);
            loader.querySelector('p').textContent = 'Escribiendo historia...';
        }
    };
    
    // --- Event Listeners ---
    modeSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.mode) {
            currentMode = button.dataset.mode;
            modeSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const isWebMode = currentMode === 'web';
            dateFilterGroup.classList.toggle('hidden', !isWebMode);
            webModeControls.classList.toggle('hidden', !isWebMode);
            genericToneGroup.classList.toggle('hidden', isWebMode);
            structureGroup.classList.toggle('hidden', currentMode !== 'chisme');
            
            if (currentMode === 'chisme') {
                const activeStructureBtn = structureSelector.querySelector('button.active');
                if (activeStructureBtn) updateStorySuggestions(activeStructureBtn.dataset.structure);
            } else {
                updateStorySuggestions(currentMode);
            }
        }
    });

    nicheSelect.addEventListener('change', populateStoryAngles);

    structureSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.structure) {
            currentStructure = button.dataset.structure;
            structureSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateStorySuggestions(currentStructure);
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
    
    imageStyleSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.style) {
            currentImageStyle = button.dataset.style;
            imageStyleSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
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

    copyPromptBtn.addEventListener('click', () => {
        if (!generatedPromptEl.textContent) return;
        navigator.clipboard.writeText(generatedPromptEl.textContent).then(() => {
            const originalContent = copyPromptBtn.innerHTML;
            copyPromptBtn.textContent = '¡Copiado!';
            copyPromptBtn.classList.add('copied');
            
            setTimeout(() => {
                copyPromptBtn.innerHTML = originalContent;
                copyPromptBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar el prompt: ', err);
            alert('No se pudo copiar el prompt.');
        });
    });

    // --- Init ---
    populateStoryAngles();
    modeSelector.querySelector(`button[data-mode="${currentMode}"]`).click();
    structureSelector.querySelector(`button[data-structure="${currentStructure}"]`).click();
    lengthSelector.querySelector(`button[data-length="${currentLength}"]`).click();
};
