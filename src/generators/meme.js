

import { createWatermarkManager } from "../utils/watermark.js";
import { makeEditable } from "../utils/ui.js";

export const initMemeGenerator = () => {
    const view = document.getElementById('meme-generator-view');
    const layoutSelector = document.getElementById('meme-layout-selector');
    const canvasContainer = document.getElementById('meme-canvas-container');
    const captureWrapper = document.getElementById('meme-capture-wrapper');
    const memeImageUpload = document.getElementById('meme-image-upload');
    const gutterSlider = document.getElementById('meme-gutter-slider');
    const gutterValue = document.getElementById('meme-gutter-value');
    const bgColorPicker = document.getElementById('meme-bg-color');
    const generateBtn = document.getElementById('generate-meme-btn');
    
    // Text controls
    const textInputsContainer = document.getElementById('meme-text-inputs-container');
    const addTextBtn = document.getElementById('add-meme-text-btn');
    const fontSelector = document.getElementById('meme-font-selector');
    const textColorPicker = document.getElementById('meme-text-color');
    const borderColorPicker = document.getElementById('meme-border-color');
    const fontSizeSlider = document.getElementById('meme-font-size-slider');
    const fontSizeValue = document.getElementById('meme-font-size-value');
    const borderThicknessSlider = document.getElementById('meme-border-thickness');
    const borderThicknessValue = document.getElementById('meme-border-thickness-value');

    let activePanel = null;
    let selectedText = null;
    const duplicateSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    const setActiveMemePanel = (panel) => {
        if (activePanel) {
            activePanel.classList.remove('active');
        }
        activePanel = panel;
        if (activePanel) {
            activePanel.classList.add('active');
        }
    };

    const createPanels = (layout) => {
        canvasContainer.innerHTML = '';
        canvasContainer.style.gridTemplateColumns = '';
        canvasContainer.style.gridTemplateRows = '';
        let panelCount = 1;
        
        switch(layout) {
            case '2v': panelCount = 2; canvasContainer.style.gridTemplateRows = '1fr 1fr'; break;
            case '2h': panelCount = 2; canvasContainer.style.gridTemplateColumns = '1fr 1fr'; break;
            case '3v': panelCount = 3; canvasContainer.style.gridTemplateRows = '1fr 1fr 1fr'; break;
            case '4g': panelCount = 4; canvasContainer.style.gridTemplateColumns = '1fr 1fr'; canvasContainer.style.gridTemplateRows = '1fr 1fr'; break;
            case '6g': panelCount = 6; canvasContainer.style.gridTemplateColumns = '1fr 1fr'; canvasContainer.style.gridTemplateRows = '1fr 1fr 1fr'; break;
            case '1f':
            default: panelCount = 1;
        }

        for (let i = 0; i < panelCount; i++) {
            const panel = document.createElement('div');
            panel.className = 'meme-panel';
            panel.dataset.panelId = i;

            const placeholder = document.createElement('div');
            placeholder.className = 'panel-placeholder';
            placeholder.textContent = 'Doble-clic o pega para subir imagen';
            panel.appendChild(placeholder);
            
            panel.addEventListener('click', () => {
                setActiveMemePanel(panel);
            });

            panel.addEventListener('dblclick', () => {
                setActiveMemePanel(panel);
                memeImageUpload.click();
            });
            
            canvasContainer.appendChild(panel);
        }

        if (canvasContainer.firstChild) {
            setActiveMemePanel(canvasContainer.firstChild);
        }
    };
    
    const handleImageFile = (file, panel) => {
        if (!file || !panel) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            panel.innerHTML = ''; // Clear placeholder or previous image
            panel.appendChild(img);
            panel.classList.add('has-image');
            
            img.onload = () => {
                // Initial positioning (cover and center)
                const panelRatio = panel.offsetWidth / panel.offsetHeight;
                const imgRatio = img.naturalWidth / img.naturalHeight;
                if (imgRatio > panelRatio) {
                    img.style.height = '100%';
                    img.style.width = 'auto';
                } else {
                    img.style.width = '100%';
                    img.style.height = 'auto';
                }
                img.style.left = `${(panel.offsetWidth - img.offsetWidth) / 2}px`;
                img.style.top = `${(panel.offsetHeight - img.offsetHeight) / 2}px`;
                
                setupImageControls(panel, img);
            };
        };
        reader.readAsDataURL(file);
    };

    const setupImageControls = (panel, img) => {
        // --- Drag/Pan Logic ---
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const startDrag = (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = img.offsetLeft;
            startTop = img.offsetTop;
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            // Constrain dragging
            const maxLeft = 0;
            const minLeft = panel.offsetWidth - img.offsetWidth;
            const maxTop = 0;
            const minTop = panel.offsetHeight - img.offsetHeight;

            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            img.style.left = `${newLeft}px`;
            img.style.top = `${newTop}px`;
        };

        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        img.addEventListener('mousedown', startDrag);

        // --- Controls UI (Zoom + Remove) ---
        const controls = document.createElement('div');
        controls.className = 'panel-controls';

        const zoomSlider = document.createElement('input');
        zoomSlider.type = 'range';
        zoomSlider.min = 100; // 100% is cover
        zoomSlider.max = 300; // 300% zoom
        zoomSlider.value = 100;
        
        zoomSlider.addEventListener('input', () => {
            const scale = zoomSlider.value / 100;
            const originalWidth = img.offsetWidth;
            const originalHeight = img.offsetHeight;

            const panelRatio = panel.offsetWidth / panel.offsetHeight;
            const imgRatio = img.naturalWidth / img.naturalHeight;

            let baseWidth, baseHeight;
            if (imgRatio > panelRatio) {
                baseHeight = panel.offsetHeight;
                baseWidth = baseHeight * imgRatio;
            } else {
                baseWidth = panel.offsetWidth;
                baseHeight = baseWidth / imgRatio;
            }
            
            const newWidth = baseWidth * scale;
            const newHeight = baseHeight * scale;

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;

            // Adjust position to zoom from center
            const dx = (newWidth - originalWidth) / 2;
            const dy = (newHeight - originalHeight) / 2;
            let newLeft = img.offsetLeft - dx;
            let newTop = img.offsetTop - dy;
            
            // Re-constrain after zoom
            const maxLeft = 0;
            const minLeft = panel.offsetWidth - newWidth;
            const maxTop = 0;
            const minTop = panel.offsetHeight - newHeight;
            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            img.style.left = `${newLeft}px`;
            img.style.top = `${newTop}px`;
        });
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'panel-remove-img-btn';
        removeBtn.title = 'Eliminar imagen';
        removeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 7H18M9 7V5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5V7M17 7V18C17 18.5304 16.7893 19.0391 16.4142 19.4142C16.0391 19.7893 15.5304 20 15 20H9C8.46957 20 7.96086 19.7893 7.58579 19.4142C7.21071 19.0391 7 18.5304 7 18V7H17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            panel.innerHTML = '';
            const placeholder = document.createElement('div');
            placeholder.className = 'panel-placeholder';
            placeholder.textContent = 'Doble-clic o pega para subir imagen';
            panel.appendChild(placeholder);
            panel.classList.remove('has-image');
        };

        controls.appendChild(zoomSlider);
        controls.appendChild(removeBtn);
        panel.appendChild(controls);
    };

    const updateGutter = () => {
        const value = gutterSlider.value;
        canvasContainer.style.gap = `${value}px`;
        gutterValue.textContent = value;
    };

    // --- Text Functionality ---
    const applyCurrentStyles = (textElement) => {
        if (!textElement) return;
        const fontSize = fontSizeSlider.value;
        const thickness = borderThicknessSlider.value;
        textElement.style.fontFamily = `'${fontSelector.value}', sans-serif`;
        textElement.style.fontSize = `${fontSize}px`;
        textElement.style.color = textColorPicker.value;
        textElement.style.textShadow = `-${thickness}px -${thickness}px 0 ${borderColorPicker.value}, ${thickness}px -${thickness}px 0 ${borderColorPicker.value}, -${thickness}px ${thickness}px 0 ${borderColorPicker.value}, ${thickness}px ${thickness}px 0 ${borderColorPicker.value}`;
        fontSizeValue.textContent = fontSize;
        borderThicknessValue.textContent = thickness;
    };

    const setSelectedText = (wrapper) => {
        if (selectedText) {
            selectedText.classList.remove('selected');
        }
        selectedText = wrapper;
        if (selectedText) {
            selectedText.classList.add('selected');
        }
    };

    const createAndAddText = (sourceWrapper = null) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'meme-text-wrapper';

        const textElement = document.createElement('div');
        textElement.className = 'meme-panel-text';

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'meme-text-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Eliminar texto';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            wrapper.remove();
            if (selectedText === wrapper) {
                selectedText = null;
            }
        };

        const duplicateBtn = document.createElement('div');
        duplicateBtn.className = 'meme-text-duplicate-btn';
        duplicateBtn.innerHTML = duplicateSVG;
        duplicateBtn.title = 'Duplicar texto';
        duplicateBtn.onclick = (e) => {
            e.stopPropagation();
            createAndAddText(wrapper);
        };
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'meme-text-resize-handle right';

        wrapper.appendChild(textElement);
        wrapper.appendChild(deleteBtn);
        wrapper.appendChild(duplicateBtn);
        wrapper.appendChild(resizeHandle);
        captureWrapper.appendChild(wrapper);

        if (sourceWrapper) {
            const sourceText = sourceWrapper.querySelector('.meme-panel-text');
            textElement.textContent = sourceText.textContent;
            textElement.style.cssText = sourceText.style.cssText;
            wrapper.style.width = sourceWrapper.style.width;
            wrapper.style.left = `${sourceWrapper.offsetLeft + 20}px`;
            wrapper.style.top = `${sourceWrapper.offsetTop + 20}px`;
        } else {
            textElement.textContent = 'Tu Texto Aquí';
            applyCurrentStyles(textElement);
            wrapper.style.width = '250px';
            wrapper.style.left = `${(captureWrapper.offsetWidth - 250) / 2}px`;
            wrapper.style.top = `${(captureWrapper.offsetHeight / 2) - 50}px`;
        }
        
        let isDragging = false, startX, startY, startLeft, startTop;
        const startDrag = (e) => {
            e.stopPropagation();
            setSelectedText(wrapper);
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = wrapper.offsetLeft;
            startTop = wrapper.offsetTop;
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        };
        const onDrag = (e) => {
            if (!isDragging) return;
            let newLeft = startLeft + (e.clientX - startX);
            let newTop = startTop + (e.clientY - startY);
            newLeft = Math.max(0, Math.min(newLeft, captureWrapper.clientWidth - wrapper.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, captureWrapper.clientHeight - wrapper.offsetHeight));
            wrapper.style.left = `${newLeft}px`;
            wrapper.style.top = `${newTop}px`;
        };
        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
        wrapper.addEventListener('mousedown', startDrag);
        
        wrapper.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (e.target.classList.contains('meme-text-resize-handle')) return;
            makeEditable(textElement);
        });

        const startResize = (e) => {
            e.preventDefault();
            e.stopPropagation();
            let startX = e.clientX;
            let startWidth = wrapper.offsetWidth;
            const onResize = (moveEvent) => {
                let newWidth = startWidth + (moveEvent.clientX - startX);
                if (newWidth < 50) newWidth = 50;
                wrapper.style.width = `${newWidth}px`;
            };
            const stopResize = () => {
                document.removeEventListener('mousemove', onResize);
                document.removeEventListener('mouseup', stopResize);
            };
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
        };
        resizeHandle.addEventListener('mousedown', startResize);
        
        setSelectedText(wrapper);
    };
    
    // --- Event Listeners ---
    layoutSelector.addEventListener('click', e => {
        const btn = e.target.closest('.layout-btn');
        if (btn) {
            layoutSelector.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            createPanels(btn.dataset.layout);
        }
    });

    memeImageUpload.addEventListener('change', e => {
        if (activePanel && e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0], activePanel);
            e.target.value = ''; // Reset input to allow re-uploading the same file
        }
    });

    view.addEventListener('paste', e => {
        if (!activePanel) {
            return;
        }
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    handleImageFile(blob, activePanel);
                }
                e.preventDefault();
                return; 
            }
        }
    });

    gutterSlider.addEventListener('input', updateGutter);
    bgColorPicker.addEventListener('input', () => {
        canvasContainer.style.backgroundColor = bgColorPicker.value;
    });
    
    generateBtn.addEventListener('click', async () => {
        if (!window.html2canvas) {
            alert('La librería de captura no está disponible.');
            return;
        }
        try {
            setSelectedText(null);
            if (activePanel) activePanel.classList.remove('active');
            captureWrapper.classList.add('capturing');
            
            const canvas = await html2canvas(captureWrapper, { useCORS: true, backgroundColor: null });
            
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `meme-${Date.now()}.png`;
            link.click();
        } catch (err) {
            console.error("Error al generar el meme:", err);
            alert("No se pudo generar la imagen del meme.");
        } finally {
            captureWrapper.classList.remove('capturing');
        }
    });
    
    // --- Text Event Listeners ---
    addTextBtn.addEventListener('click', () => createAndAddText(null));
    [fontSelector, textColorPicker, borderColorPicker, fontSizeSlider, borderThicknessSlider].forEach(el => {
        el.addEventListener('input', () => {
            if(selectedText) {
                applyCurrentStyles(selectedText.querySelector('.meme-panel-text'));
            }
        });
    });

    captureWrapper.addEventListener('click', (e) => {
        if (e.target === captureWrapper) {
            setSelectedText(null);
        }
    });


    // --- Watermark ---
    const watermarkManager = createWatermarkManager({
        textTabEl: document.getElementById('meme-watermark-text-tab'),
        imageTabEl: document.getElementById('meme-watermark-image-tab'),
        textOptionsEl: document.getElementById('meme-watermark-text-options'),
        imageOptionsEl: document.getElementById('meme-watermark-image-options'),
        textInputEl: document.getElementById('meme-watermark-text'),
        colorInputEl: document.getElementById('meme-watermark-color'),
        imageUploadEl: document.getElementById('meme-watermark-upload'),
        sizeSliderEl: document.getElementById('meme-watermark-size'),
        opacitySliderEl: document.getElementById('meme-watermark-opacity'),
        removeBtnEl: document.getElementById('meme-remove-watermark-btn'),
        overlayEl: document.getElementById('meme-watermark-overlay'),
        containerEl: captureWrapper,
        sizeLabelText: "Tamaño:",
        sizeLabelImage: "Ancho:",
        sizeLabelSelector: '#meme-generator-view .watermark-slider label[for="meme-watermark-size"]'
    });
    watermarkManager.init();

    // --- Initial setup ---
    const defaultLayoutBtn = layoutSelector.querySelector('.layout-btn');
    defaultLayoutBtn.classList.add('active');
    createPanels(defaultLayoutBtn.dataset.layout);
    updateGutter();
};