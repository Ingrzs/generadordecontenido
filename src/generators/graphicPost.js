import { createWatermarkManager } from "../utils/watermark.js";
import { makeEditable } from "../utils/ui.js";

export const initGraphicPostGenerator = () => {
    // --- Elements ---
    const view = document.getElementById('graphic-post-generator-view');
    const layoutSelector = document.getElementById('gp-layout-selector');
    const captureWrapper = document.getElementById('gp-capture-wrapper');
    const canvasContainer = document.getElementById('gp-canvas-container');
    const bgColorPicker = document.getElementById('gp-bg-color');
    const generateBtn = document.getElementById('gp-generate-btn');
    const bgImageUpload = document.getElementById('gp-bg-image-upload');
    const gutterSlider = document.getElementById('gp-gutter-slider');
    const gutterValue = document.getElementById('gp-gutter-value');
    
    // Aspect Ratio
    const aspectRatioSelector = document.getElementById('gp-aspect-ratio-selector');

    // Text controls
    const addTextBtn = document.getElementById('gp-add-text-btn');
    const fontSelector = document.getElementById('gp-font-selector');
    const textColorPicker = document.getElementById('gp-text-color');
    const borderColorPicker = document.getElementById('gp-border-color');
    const fontSizeSlider = document.getElementById('gp-font-size-slider');
    const fontSizeValue = document.getElementById('gp-font-size-value');
    const borderThicknessSlider = document.getElementById('gp-border-thickness');
    const borderThicknessValue = document.getElementById('gp-border-thickness-value');
    const textStyleControls = [fontSelector, textColorPicker, borderColorPicker, fontSizeSlider, borderThicknessSlider];
    
    // Image Overlay Elements
    const addImageLayerBtn = document.getElementById('gp-add-image-layer-btn');
    const addCircleLayerBtn = document.getElementById('gp-add-circle-layer-btn');
    const overlayImageUpload = document.getElementById('gp-overlay-image-upload');
    
    // Circle Border Controls
    const circleBorderControls = document.getElementById('gp-circle-border-controls');
    const circleBorderColor = document.getElementById('gp-circle-border-color');
    const circleBorderWidth = document.getElementById('gp-circle-border-width');
    const circleBorderWidthValue = document.getElementById('gp-circle-border-width-value');

    // --- State ---
    let activePanel = null;
    let selectedElement = { element: null, type: null };
    let isUploadingCircular = false;
    const duplicateSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    const rgbToHex = (rgb) => {
        if (!rgb || !rgb.includes('rgb')) return '#000000';
        let sep = rgb.indexOf(",") > -1 ? "," : " ";
        rgb = rgb.substr(4).split(")")[0].split(sep);
        let r = (+rgb[0]).toString(16),
            g = (+rgb[1]).toString(16),
            b = (+rgb[2]).toString(16);
        if (r.length == 1) r = "0" + r;
        if (g.length == 1) g = "0" + g;
        if (b.length == 1) b = "0" + b;
        return "#" + r + g + b;
    };

    const createLayout = (layout) => {
        canvasContainer.innerHTML = '';
        canvasContainer.style.flexDirection = 'row';
        let panelCount = 1;

        switch(layout) {
            case '2v': panelCount = 2; canvasContainer.style.flexDirection = 'column'; break;
            case '2h': panelCount = 2; break;
            case '3v': panelCount = 3; canvasContainer.style.flexDirection = 'column'; break;
            case '3h': panelCount = 3; break;
            case '1': default: panelCount = 1;
        }

        for (let i = 0; i < panelCount; i++) {
            const panel = document.createElement('div');
            panel.className = 'gp-panel';
            panel.dataset.panelId = i;
            panel.textContent = 'Doble-clic o pega para fondo';

            panel.addEventListener('click', () => activePanel = panel);
            panel.addEventListener('dblclick', () => {
                activePanel = panel;
                bgImageUpload.click();
            });
            canvasContainer.appendChild(panel);
        }
        if (canvasContainer.firstChild) {
            activePanel = canvasContainer.firstChild;
        }
    };
    
    const handleBackgroundImage = (file, panel) => {
        if (!file || !panel) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.className = 'gp-panel-bg-img';
            img.src = e.target.result;
            
            panel.innerHTML = ''; // Clear placeholder text
            panel.appendChild(img);

            img.onload = () => {
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

                let isDragging = false, startX, startY, startLeft, startTop;

                const startDrag = (dragEvent) => {
                    dragEvent.preventDefault();
                    isDragging = true;
                    startX = dragEvent.clientX;
                    startY = dragEvent.clientY;
                    startLeft = img.offsetLeft;
                    startTop = img.offsetTop;
                    document.addEventListener('mousemove', onDrag);
                    document.addEventListener('mouseup', stopDrag);
                };
                const onDrag = (dragEvent) => {
                    if (!isDragging) return;
                    const dx = dragEvent.clientX - startX;
                    const dy = dragEvent.clientY - startY;
                    let newLeft = startLeft + dx;
                    let newTop = startTop + dy;
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
            };
        };
        reader.readAsDataURL(file);
    };

    const setSelectedElement = (element, type) => {
        if (selectedElement.element) {
            selectedElement.element.classList.remove('selected');
        }
        selectedElement = { element, type };
        if (element) {
            element.classList.add('selected');
        }

        const isCircularImage = type === 'image' && element?.classList.contains('circular');
        circleBorderControls.classList.toggle('hidden', !isCircularImage);
        
        if (isCircularImage) {
            const clipper = element.querySelector('.gp-image-clipper');
            const currentBorder = window.getComputedStyle(clipper).border;
            const parts = currentBorder.match(/(\d+\.?\d*)px.*(rgb\(.*\)|#[0-9a-fA-F]{6})/);
            if (parts) {
                circleBorderWidth.value = parseFloat(parts[1]);
                circleBorderColor.value = parts[2].startsWith('rgb') ? rgbToHex(parts[2]) : parts[2];
            } else {
                circleBorderWidth.value = 0;
                circleBorderColor.value = '#000000';
            }
            circleBorderWidthValue.textContent = circleBorderWidth.value;
        }

        // Only disable style controls if an image is selected.
        textStyleControls.forEach(control => {
            const parent = control.closest('.form-group') || control;
            parent.style.opacity = (type === 'image') ? '0.5' : '1';
            control.disabled = (type === 'image');
        });
    };

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

    const createAndAddText = (sourceWrapper = null) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'gp-text-wrapper';

        const textElement = document.createElement('div');
        textElement.className = 'gp-panel-text';

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'gp-text-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => { e.stopPropagation(); wrapper.remove(); if (selectedElement.element === wrapper) setSelectedElement(null, null); };

        const duplicateBtn = document.createElement('div');
        duplicateBtn.className = 'gp-text-duplicate-btn';
        duplicateBtn.innerHTML = duplicateSVG;
        duplicateBtn.onclick = (e) => { e.stopPropagation(); createAndAddText(wrapper); };
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'gp-text-resize-handle right';

        wrapper.append(textElement, deleteBtn, duplicateBtn, resizeHandle);
        captureWrapper.appendChild(wrapper);

        if (sourceWrapper) {
            const sourceText = sourceWrapper.querySelector('.gp-panel-text');
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
            setSelectedElement(wrapper, 'text');
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            startLeft = wrapper.offsetLeft; startTop = wrapper.offsetTop;
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
        const stopDrag = () => { isDragging = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag); };
        wrapper.addEventListener('mousedown', startDrag);
        
        wrapper.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (e.target.classList.contains('gp-text-resize-handle')) return;
            makeEditable(textElement);
        });

        const startResize = (e) => {
            e.preventDefault(); e.stopPropagation();
            let startX = e.clientX; let startWidth = wrapper.offsetWidth;
            const onResize = (moveEvent) => {
                let newWidth = startWidth + (moveEvent.clientX - startX);
                wrapper.style.width = `${Math.max(50, newWidth)}px`;
            };
            const stopResize = () => { document.removeEventListener('mousemove', onResize); document.removeEventListener('mouseup', stopResize); };
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
        };
        resizeHandle.addEventListener('mousedown', startResize);
        
        setSelectedElement(wrapper, 'text');
    };

    const createAndAddImage = (imageData, isCircular, sourceWrapper = null) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'gp-image-wrapper';
        if (isCircular) wrapper.classList.add('circular');

        const clipper = document.createElement('div');
        clipper.className = 'gp-image-clipper';
        
        const img = document.createElement('img');
        img.src = imageData;
        clipper.appendChild(img);
        
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'gp-image-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => { e.stopPropagation(); wrapper.remove(); if (selectedElement.element === wrapper) setSelectedElement(null, null); };

        const duplicateBtn = document.createElement('div');
        duplicateBtn.className = 'gp-image-duplicate-btn';
        duplicateBtn.innerHTML = duplicateSVG;
        duplicateBtn.onclick = (e) => { e.stopPropagation(); createAndAddImage(imageData, isCircular, wrapper); };
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'gp-image-resize-handle';

        wrapper.append(clipper, deleteBtn, duplicateBtn, resizeHandle);
        captureWrapper.appendChild(wrapper);

        img.onload = () => {
            if (sourceWrapper) {
                wrapper.style.width = sourceWrapper.style.width;
                wrapper.style.height = sourceWrapper.style.height;
                wrapper.style.left = `${sourceWrapper.offsetLeft + 20}px`;
                wrapper.style.top = `${sourceWrapper.offsetTop + 20}px`;
            } else {
                const initialSize = Math.min(captureWrapper.offsetWidth, captureWrapper.offsetHeight) * 0.4;
                if (isCircular) {
                    wrapper.style.width = `${initialSize}px`;
                    wrapper.style.height = `${initialSize}px`;
                } else {
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    wrapper.style.width = `${initialSize}px`;
                    wrapper.style.height = `${initialSize / aspectRatio}px`;
                }
                wrapper.style.left = `${(captureWrapper.offsetWidth - wrapper.offsetWidth) / 2}px`;
                wrapper.style.top = `${(captureWrapper.offsetHeight - wrapper.offsetHeight) / 2}px`;
            }

            const wrapperRatio = wrapper.offsetWidth / wrapper.offsetHeight;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            if (imgRatio > wrapperRatio) {
                img.style.height = '100%';
                img.style.width = 'auto';
            } else {
                img.style.width = '100%';
                img.style.height = 'auto';
            }
            img.style.left = `${(wrapper.offsetWidth - img.offsetWidth) / 2}px`;
            img.style.top = `${(wrapper.offsetHeight - img.offsetHeight) / 2}px`;
        };

        let dragMode = 'pan';
        wrapper.style.cursor = 'grab';

        wrapper.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            dragMode = (dragMode === 'pan') ? 'move' : 'pan';
            wrapper.style.cursor = (dragMode === 'pan') ? 'grab' : 'move';
        });

        let isActionInProgress = false, startX, startY, startLeft, startTop;

        const startAction = (e) => {
            if (e.target.classList.contains('gp-image-resize-handle')) return;
            e.stopPropagation();
            setSelectedElement(wrapper, 'image');
            
            isActionInProgress = true;
            startX = e.clientX;
            startY = e.clientY;

            if (dragMode === 'move') {
                startLeft = wrapper.offsetLeft;
                startTop = wrapper.offsetTop;
            } else {
                startLeft = img.offsetLeft;
                startTop = img.offsetTop;
                wrapper.style.cursor = 'grabbing';
            }

            document.addEventListener('mousemove', onAction);
            document.addEventListener('mouseup', stopAction);
        };

        const onAction = (e) => {
            if (!isActionInProgress) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            if (dragMode === 'move') {
                newLeft = Math.max(0, Math.min(newLeft, captureWrapper.clientWidth - wrapper.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, captureWrapper.clientHeight - wrapper.offsetHeight));
                wrapper.style.left = `${newLeft}px`;
                wrapper.style.top = `${newTop}px`;
            } else {
                const maxLeft = 0;
                const minLeft = wrapper.offsetWidth - img.offsetWidth;
                const maxTop = 0;
                const minTop = wrapper.offsetHeight - img.offsetHeight;
                newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
                newTop = Math.max(minTop, Math.min(maxTop, newTop));
                img.style.left = `${newLeft}px`;
                img.style.top = `${newTop}px`;
            }
        };

        const stopAction = () => {
            isActionInProgress = false;
            wrapper.style.cursor = (dragMode === 'move') ? 'move' : 'grab';
            document.removeEventListener('mousemove', onAction);
            document.removeEventListener('mouseup', stopAction);
        };

        wrapper.addEventListener('mousedown', startAction);

        const startResize = (e) => {
            e.preventDefault(); e.stopPropagation();
            const isCircularHandle = wrapper.classList.contains('circular');
            const aspectRatio = isCircularHandle ? 1 : wrapper.offsetWidth / wrapper.offsetHeight;
            let resizeStartX = e.clientX;
            let resizeStartWidth = wrapper.offsetWidth;
            const onResize = (moveEvent) => {
                let newWidth = resizeStartWidth + (moveEvent.clientX - resizeStartX);
                if (newWidth < 30) newWidth = 30;
                wrapper.style.width = `${newWidth}px`;
                wrapper.style.height = `${newWidth / aspectRatio}px`;
            };
            const stopResize = () => { document.removeEventListener('mousemove', onResize); document.removeEventListener('mouseup', stopResize); };
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
        };
        resizeHandle.addEventListener('mousedown', startResize);
        
        setSelectedElement(wrapper, 'image');
    };

    const watermarkManager = createWatermarkManager({
        textTabEl: document.getElementById('gp-watermark-text-tab'),
        imageTabEl: document.getElementById('gp-watermark-image-tab'),
        textOptionsEl: document.getElementById('gp-watermark-text-options'),
        imageOptionsEl: document.getElementById('gp-watermark-image-options'),
        textInputEl: document.getElementById('gp-watermark-text'),
        colorInputEl: document.getElementById('gp-watermark-color'),
        imageUploadEl: document.getElementById('gp-watermark-upload'),
        sizeSliderEl: document.getElementById('gp-watermark-size'),
        opacitySliderEl: document.getElementById('gp-watermark-opacity'),
        removeBtnEl: document.getElementById('gp-remove-watermark-btn'),
        overlayEl: document.getElementById('gp-watermark-overlay'),
        containerEl: captureWrapper,
        sizeLabelText: "Tamaño:",
        sizeLabelImage: "Ancho:",
        sizeLabelSelector: '#graphic-post-generator-view .watermark-slider label[for="gp-watermark-size"]'
    });
    watermarkManager.init();

    layoutSelector.addEventListener('click', e => {
        const btn = e.target.closest('.layout-btn');
        if (btn) {
            layoutSelector.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            createLayout(btn.dataset.layout);
        }
    });

    aspectRatioSelector.addEventListener('click', e => {
        const btn = e.target.closest('.layout-btn');
        if (btn) {
            aspectRatioSelector.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const ratio = btn.dataset.ratio.replace(':', ' / ');
            captureWrapper.style.aspectRatio = ratio;
        }
    });

    gutterSlider.addEventListener('input', () => {
        const value = gutterSlider.value;
        canvasContainer.style.gap = `${value}px`;
        gutterValue.textContent = value;
    });

    bgColorPicker.addEventListener('input', () => canvasContainer.style.backgroundColor = bgColorPicker.value);

    bgImageUpload.addEventListener('change', e => {
        if (activePanel && e.target.files && e.target.files[0]) handleBackgroundImage(e.target.files[0], activePanel);
        e.target.value = '';
    });

    view.addEventListener('paste', e => {
        if (!activePanel) return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) handleBackgroundImage(blob, activePanel);
                e.preventDefault(); return; 
            }
        }
    });

    addTextBtn.addEventListener('click', () => createAndAddText(null));
    textStyleControls.forEach(el => {
        el.addEventListener('input', () => {
            if (selectedElement.type === 'text' && selectedElement.element) {
                applyCurrentStyles(selectedElement.element.querySelector('.gp-panel-text'));
            }
        });
    });

    addImageLayerBtn.addEventListener('click', () => {
        isUploadingCircular = false;
        overlayImageUpload.click();
    });
    addCircleLayerBtn.addEventListener('click', () => {
        isUploadingCircular = true;
        overlayImageUpload.click();
    });
    overlayImageUpload.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => createAndAddImage(ev.target.result, isUploadingCircular);
            reader.readAsDataURL(e.target.files[0]);
        }
        e.target.value = '';
    });

    const updateCircleBorder = () => {
        if (selectedElement.type === 'image' && selectedElement.element?.classList.contains('circular')) {
            const clipper = selectedElement.element.querySelector('.gp-image-clipper');
            const width = circleBorderWidth.value;
            const color = circleBorderColor.value;
            clipper.style.border = `${width}px solid ${color}`;
            circleBorderWidthValue.textContent = width;
        }
    };
    circleBorderColor.addEventListener('input', updateCircleBorder);
    circleBorderWidth.addEventListener('input', updateCircleBorder);

    captureWrapper.addEventListener('click', (e) => {
        // Deselect only when clicking the background, not panels.
        if (e.target === captureWrapper || e.target === canvasContainer) {
            setSelectedElement(null, null);
        }
    });

    generateBtn.addEventListener('click', async () => {
        setSelectedElement(null, null);
        captureWrapper.classList.add('capturing');
        try {
            const canvas = await html2canvas(captureWrapper, { useCORS: true, backgroundColor: null });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `post-grafico-${Date.now()}.png`;
            link.click();
        } catch (error) {
            console.error('Error al generar la imagen:', error);
            alert('No se pudo generar la imagen.');
        } finally {
            setTimeout(() => captureWrapper.classList.remove('capturing'), 100);
        }
    });

    const defaultLayoutBtn = layoutSelector.querySelector('.layout-btn');
    defaultLayoutBtn.classList.add('active');
    createLayout(defaultLayoutBtn.dataset.layout);
    canvasContainer.style.backgroundColor = bgColorPicker.value;
    gutterSlider.dispatchEvent(new Event('input'));
    setSelectedElement(null, null); // Set initial state for controls
};