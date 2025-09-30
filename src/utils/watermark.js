export const createWatermarkManager = (config) => {
    const {
        textTabEl, imageTabEl, textOptionsEl, imageOptionsEl, textInputEl, colorInputEl,
        imageUploadEl, sizeSliderEl, opacitySliderEl, removeBtnEl, overlayEl, containerEl,
        sizeLabelText, sizeLabelImage, sizeLabelSelector
    } = config;

    let isDragging = false;
    let offsetX, offsetY;
    let isTextMode = true;

    const updateOverlay = () => {
        if (!isTextMode) { // Image mode
            const image = overlayEl.querySelector('img');
            if (image) {
                image.style.opacity = opacitySliderEl.value / 100;
                image.style.width = `${sizeSliderEl.value}px`;
            }
        } else { // Text mode
            const span = overlayEl.querySelector('span');
            if (span) {
                span.textContent = textInputEl.value;
                span.style.color = colorInputEl.value;
                span.style.opacity = opacitySliderEl.value / 100;
                span.style.fontSize = `${sizeSliderEl.value}px`;
            }
        }
    };

    const setWatermarkType = (type) => {
        isTextMode = type === 'text';
        textTabEl.classList.toggle('active', isTextMode);
        imageTabEl.classList.toggle('active', !isTextMode);
        textOptionsEl.classList.toggle('hidden', !isTextMode);
        imageOptionsEl.classList.toggle('hidden', isTextMode);

        const parentView = containerEl.closest('.post-preview-area, #chat-generator-view, .meme-preview-area');
        if (parentView) {
            const sizeLabel = parentView.querySelector(sizeLabelSelector);
            if (sizeLabel) {
                sizeLabel.textContent = isTextMode ? sizeLabelText : sizeLabelImage;
            }
        }

        if (isTextMode && textInputEl.value) {
            overlayEl.innerHTML = `<span>${textInputEl.value}</span>`;
            overlayEl.classList.remove('hidden');
        } else if (!isTextMode && overlayEl.querySelector('img')) {
             overlayEl.classList.remove('hidden');
        } else {
            overlayEl.classList.add('hidden');
        }
        updateOverlay();
    };

    const handleImageUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                overlayEl.innerHTML = `<img src="${e.target.result}" alt="Watermark">`;
                overlayEl.classList.remove('hidden');
                setWatermarkType('image');
                updateOverlay();
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    const removeWatermark = () => {
        overlayEl.innerHTML = '';
        overlayEl.classList.add('hidden');
        textInputEl.value = '';
        imageUploadEl.value = '';
    };

    const startDrag = (e) => {
        // Only drag the overlay itself, not its content (image/text)
        if (e.target !== overlayEl) return;
        e.preventDefault();
        isDragging = true;
        
        // Calculate the initial offset of the mouse from the element's top-left corner
        const overlayRect = overlayEl.getBoundingClientRect();
        offsetX = e.clientX - overlayRect.left;
        offsetY = e.clientY - overlayRect.top;

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    };
    
    const onDrag = (e) => {
        if (isDragging) {
            e.preventDefault();
            const containerRect = containerEl.getBoundingClientRect();
            
            // Calculate the new top-left corner position relative to the container
            let newLeft = e.clientX - containerRect.left - offsetX;
            let newTop = e.clientY - containerRect.top - offsetY;
            
            // Constrain movement within the container's boundaries
            newLeft = Math.max(0, Math.min(newLeft, containerEl.clientWidth - overlayEl.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, containerEl.clientHeight - overlayEl.offsetHeight));
            
            overlayEl.style.left = `${newLeft}px`;
            overlayEl.style.top = `${newTop}px`;
        }
    };

    const stopDrag = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    };

    const init = () => {
        textTabEl.addEventListener('click', () => setWatermarkType('text'));
        imageTabEl.addEventListener('click', () => setWatermarkType('image'));
        removeBtnEl.addEventListener('click', removeWatermark);
        
        textInputEl.addEventListener('input', () => {
             if (isTextMode) {
                 if(textInputEl.value.trim()){
                    if(!overlayEl.querySelector('span')) {
                        overlayEl.innerHTML = `<span></span>`;
                    }
                    overlayEl.classList.remove('hidden');
                 } else {
                    overlayEl.innerHTML = ``;
                    overlayEl.classList.add('hidden');
                 }
                updateOverlay();
             }
        });
        
        colorInputEl.addEventListener('input', updateOverlay);
        imageUploadEl.addEventListener('change', handleImageUpload);
        sizeSliderEl.addEventListener('input', updateOverlay);
        opacitySliderEl.addEventListener('input', updateOverlay);
        overlayEl.addEventListener('mousedown', startDrag);
    };

    return {
        init,
        getOverlay: () => overlayEl
    };
};
