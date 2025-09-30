import { Type } from "@google/genai";
import { getAiInstance } from '../services/api.js';
import { makeEditable } from '../utils/ui.js';
import { getCurrentTimestamp } from "../utils/helpers.js";
import { createWatermarkManager } from "../utils/watermark.js";

export const initChatGenerator = () => {
    // --- Elements ---
    const form = document.getElementById('chat-form');
    const persona1DescInput = document.getElementById('persona1-desc');
    const persona2DescInput = document.getElementById('persona2-desc');
    const topicInput = document.getElementById('topic');
    const toneSelect = document.getElementById('tone');
    const styleSelect = document.getElementById('style');
    const lengthSelect = document.getElementById('length');
    const emojisSelect = document.getElementById('emojis');
    const starterSelect = document.getElementById('starter');
    const backgroundUpload = document.getElementById('background-upload');
    const generateBtn = document.getElementById('generate-btn');
    const downloadFullBtn = document.getElementById('download-full-btn');
    const downloadChatOnlyBtn = document.getElementById('download-chat-only-btn');
    const chatDownloadButtons = document.querySelectorAll('#chat-generator-view .download-button');
    const chatWindow = document.getElementById('chat-window');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const loader = document.getElementById('loader');
    const imageUploadInput = document.getElementById('image-upload-input');
    const profilePicContainer = document.getElementById('profile-pic-container');
    const profilePicImg = document.getElementById('profile-pic-img');
    const profilePicUpload = document.getElementById('profile-pic-upload');
    const defaultProfileIcon = document.getElementById('default-profile-icon');
    const contactNameSpan = document.getElementById('contact-name');
    const contactStatusSpan = document.getElementById('contact-status');
    
    // --- State ---
    let currentConversation = [];
    let imageUploadTarget = { sender: null, index: null, isSticker: false };

    const statusSVGs = {
        read: `<svg viewBox="0 0 18 18" width="18" height="18"><path fill="#4FC3F7" d="M17.394 5.035l-.57-.443a.453.453 0 00-.638.083l-6.2 7.61-3.23-2.84a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l3.99 3.513a.453.453 0 00.613.02l.025-.02 6.917-8.497a.453.453 0 00-.083-.638zM12.56 5.035l-.57-.443a.453.453 0 00-.638.083L5.435 12.29l-1.39-1.22a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l2.147 1.89a.453.453 0 00.613.02l.025-.02 1.48-1.82-.54-.42a.453.453 0 01-.07-.62z"></path></svg>`,
        delivered: `<svg viewBox="0 0 18 18" width="18" height="18"><path fill="#667781" d="M17.394 5.035l-.57-.443a.453.453 0 00-.638.083l-6.2 7.61-3.23-2.84a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l3.99 3.513a.453.453 0 00.613.02l.025-.02 6.917-8.497a.453.453 0 00-.083-.638zM12.56 5.035l-.57-.443a.453.453 0 00-.638.083L5.435 12.29l-1.39-1.22a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l2.147 1.89a.453.453 0 00.613.02l.025-.02 1.48-1.82-.54-.42a.453.453 0 01-.07-.62z"></path></svg>`,
        sent: `<svg viewBox="0 0 18 18" width="18" height="18"><path fill="#667781" d="M17.394 5.035l-.57-.443a.453.453 0 00-.638.083l-6.2 7.61-3.23-2.84a.453.453 0 00-.592.132l-.46.52a.453.453 0 00.083.638l3.99 3.513a.453.453 0 00.613.02l.025-.02 6.917-8.497a.453.453 0 00-.083-.638z"></path></svg>`,
        pending: `<svg width="18" height="18" viewBox="0 0 16 16"><path fill="#667781" d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zm0-2A4 4 0 1 1 8 4a4 4 0 0 1 0 8zM7.5 5v3.5L10.5 10l.5-1-2.5-1.5V5h-1z"></path></svg>`
    };
    const statusCycle = ['read', 'delivered', 'sent', 'pending'];
    const trashSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 7H18M9 7V5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5V7M17 7V18C17 18.5304 16.7893 19.0391 16.4142 19.4142C16.0391 19.7893 15.5304 20 15 20H9C8.46957 20 7.96086 19.7893 7.58579 19.4142C7.21071 19.0391 7 18.5304 7 18V7H17Z" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const imageSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    const stickerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`;

    // --- Watermark ---
    const watermarkManager = createWatermarkManager({
        textTabEl: document.getElementById('watermark-text-tab'),
        imageTabEl: document.getElementById('watermark-image-tab'),
        textOptionsEl: document.getElementById('watermark-text-options'),
        imageOptionsEl: document.getElementById('watermark-image-options'),
        textInputEl: document.getElementById('watermark-text'),
        colorInputEl: document.getElementById('watermark-color'),
        imageUploadEl: document.getElementById('watermark-upload'),
        sizeSliderEl: document.getElementById('watermark-size'),
        opacitySliderEl: document.getElementById('watermark-opacity'),
        removeBtnEl: document.getElementById('remove-watermark-btn'),
        overlayEl: document.getElementById('watermark-overlay'),
        containerEl: chatWindow,
        sizeLabelText: "Tamaño:",
        sizeLabelImage: "Ancho:",
        sizeLabelSelector: '.watermark-slider label[for="watermark-size"]'
    });
    watermarkManager.init();
    
    // --- Functions ---
    const displayMessages = () => {
        chatMessagesContainer.innerHTML = ''; 
        const createInserter = (index) => {
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
                    const currentStatusIndex = statusCycle.indexOf(msg.status);
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

    const displayError = (errorMessage) => {
        chatMessagesContainer.innerHTML = `<div class="placeholder">${errorMessage}</div>`;
        chatDownloadButtons.forEach(btn => btn.classList.add('hidden'));
    };

    const toggleLoading = (isLoading) => {
        generateBtn.disabled = isLoading;
        loader.classList.toggle('hidden', !isLoading);
    };

    const generateChat = async (event) => {
        event.preventDefault();
        
        const ai = getAiInstance();
        if (!ai) {
            displayError('Por favor, introduce tu clave API de Google AI Studio para generar el chat.');
            // The initAi function in api.js already alerts the user.
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
            displayError((error).message.includes("API key not valid") ? "Tu clave API no es válida. Por favor, usa otra." : "Lo siento, ocurrió un error al generar el chat. Inténtalo de nuevo.");
        } finally {
            toggleLoading(false);
        }
    };
    
    const addTextMessage = (sender, index) => {
        const newMessage = { sender: sender, message: 'Nuevo mensaje...', timestamp: getCurrentTimestamp(), status: sender === 'Persona 2' ? 'delivered' : undefined };
        currentConversation.splice(index, 0, newMessage);
        displayMessages();
        const messageEl = chatMessagesContainer.querySelector(`[data-index="${index}"]`);
        if (messageEl) { 
            const textSpan = messageEl.querySelector('span:not(.timestamp):not(.message-meta)'); 
            if (textSpan) { 
                makeEditable(textSpan, (newValue) => { newMessage.message = newValue; }); 
                const range = document.createRange(); 
                range.selectNodeContents(textSpan); 
                const sel = window.getSelection(); 
                sel?.removeAllRanges(); 
                sel?.addRange(range); 
            } 
        }
    };

    const downloadChatScreenshot = async (elementToCapture, fileName) => {
        const currentlyEditing = document.querySelector('[contenteditable="true"]');
        if (currentlyEditing) (currentlyEditing).blur();

        const watermarkOverlay = watermarkManager.getOverlay();
        const watermarkVisible = !watermarkOverlay.classList.contains('hidden');
        const shouldMoveWatermark = elementToCapture === chatMessagesContainer && watermarkVisible;
        const originalWatermarkParent = watermarkOverlay.parentElement; 
        const originalWatermarkTop = watermarkOverlay.style.top; 
        const originalWatermarkLeft = watermarkOverlay.style.left; 
        const originalMessagesPosition = chatMessagesContainer.style.position;

        if (shouldMoveWatermark) { 
            const chatHeader = document.getElementById('chat-header'); 
            const newTop = watermarkOverlay.offsetTop - chatHeader.offsetHeight; 
            chatMessagesContainer.style.position = 'relative'; 
            chatMessagesContainer.appendChild(watermarkOverlay); 
            watermarkOverlay.style.top = `${newTop}px`; 
        }
        
        try {
            const canvas = await html2canvas(elementToCapture, { 
                useCORS: true, 
                backgroundColor: null, 
                onclone: (doc) => { 
                    const clonedElement = doc.getElementById(elementToCapture.id); 
                    if (clonedElement) { 
                        clonedElement.querySelectorAll('.message-inserter, .message-actions').forEach(el => (el).style.display = 'none'); 
                    } 
                } 
            });
            const link = document.createElement('a'); 
            link.href = canvas.toDataURL('image/png'); 
            link.download = fileName; 
            document.body.appendChild(link); 
            link.click(); 
            document.body.removeChild(link);
        } catch (error) { 
            console.error("Error al generar la captura:", error); 
            alert("No se pudo generar la captura de pantalla."); 
        } finally { 
            if (shouldMoveWatermark && originalWatermarkParent) { 
                originalWatermarkParent.appendChild(watermarkOverlay); 
                watermarkOverlay.style.top = originalWatermarkTop; 
                watermarkOverlay.style.left = originalWatermarkLeft; 
                chatMessagesContainer.style.position = originalMessagesPosition; 
            } 
        }
    };

    const handleBackgroundChange = (event) => {
        const input = event.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    const imageUrl = `url('${e.target.result}')`;
                    chatMessagesContainer.style.backgroundImage = imageUrl; 
                    chatWindow.style.backgroundImage = imageUrl;
                    chatMessagesContainer.style.backgroundSize = 'auto'; 
                    chatWindow.style.backgroundSize = 'auto';
                    chatMessagesContainer.style.backgroundRepeat = 'repeat'; 
                    chatWindow.style.backgroundRepeat = 'repeat';
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    // --- Event Listeners ---
    form.addEventListener('submit', generateChat);
    downloadFullBtn.addEventListener('click', () => downloadChatScreenshot(chatWindow, `captura-completa-${Date.now()}.png`));
    downloadChatOnlyBtn.addEventListener('click', () => downloadChatScreenshot(chatMessagesContainer, `solo-chat-${Date.now()}.png`));
    backgroundUpload.addEventListener('change', handleBackgroundChange);
    
    imageUploadInput.addEventListener('change', (event) => { 
        const input = event.target; 
        if (input.files && input.files[0] && imageUploadTarget.sender && imageUploadTarget.index !== null) { 
            const reader = new FileReader(); 
            reader.onload = (e) => { 
                if (e.target?.result) { 
                    const newMessage = { 
                        sender: imageUploadTarget.sender, 
                        imageUrl: e.target.result, 
                        isSticker: imageUploadTarget.isSticker || false, 
                        timestamp: getCurrentTimestamp(), 
                        status: imageUploadTarget.sender === 'Persona 2' ? 'delivered' : undefined 
                    }; 
                    currentConversation.splice(imageUploadTarget.index, 0, newMessage); 
                    displayMessages(); 
                } 
                imageUploadTarget = { sender: null, index: null, isSticker: false }; 
                input.value = ''; 
            }; 
            reader.readAsDataURL(input.files[0]); 
        } 
    });

    profilePicContainer.addEventListener('click', () => profilePicUpload.click());
    
    profilePicUpload.addEventListener('change', (event) => { 
        const input = event.target; 
        if (input.files && input.files[0]) { 
            const reader = new FileReader(); 
            reader.onload = (e) => { 
                if (e.target?.result) { 
                    profilePicImg.src = e.target.result; 
                    if(defaultProfileIcon) defaultProfileIcon.style.display = 'none'; 
                } 
            }; 
            reader.readAsDataURL(input.files[0]); 
        } 
    });

    contactNameSpan.addEventListener('click', () => makeEditable(contactNameSpan));
    contactStatusSpan.addEventListener('click', () => makeEditable(contactStatusSpan));
    
    // --- Initial setup ---
    displayMessages();
};
