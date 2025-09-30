


const tabViewMap = {
    'chat': 'chat-generator-view',
    'post': 'post-generator-view',
    'image-post': 'image-post-generator-view',
    'facebook-post': 'facebook-post-generator-view',
    'text-enhancer': 'text-enhancer-view',
    'meme': 'meme-generator-view',
    'graphic-post': 'graphic-post-generator-view'
};

/**
 * Sets the active tab and shows the corresponding view.
 * @param {string} tabName - The name of the tab to activate (from data-tab attribute).
 */
export const setActiveTab = (tabName) => {
    // Deactivate all tabs and hide all views
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    Object.values(tabViewMap).forEach(viewId => {
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('hidden');
        }
    });

    // Activate the selected tab and show its view
    const activeTabButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    }

    const activeViewId = tabViewMap[tabName];
    if (activeViewId) {
        const activeView = document.getElementById(activeViewId);
        if (activeView) {
            activeView.classList.remove('hidden');
        }
    }
};

/**
 * Makes an element editable and calls a callback on blur.
 * @param {HTMLElement} element - The element to make editable.
 * @param {(newValue: string) => void} [onUpdate] - Optional callback with the new value.
 */
export const makeEditable = (element, onUpdate) => {
    // Prevent making an already-editing element editable again
    if (element.isContentEditable) {
        return;
    }
    
    element.contentEditable = 'true';
    element.focus();

    // Select all text in the element
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const originalValue = element.textContent;

    const onBlur = () => {
        element.contentEditable = 'false';
        const newValue = element.textContent;
        if (newValue !== originalValue && onUpdate) {
            onUpdate(newValue);
        }
        element.removeEventListener('blur', onBlur);
        element.removeEventListener('keydown', onKeyDown);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            element.blur();
        } else if (e.key === 'Escape') {
            element.textContent = originalValue;
            element.blur();
        }
    };

    element.addEventListener('blur', onBlur);
    element.addEventListener('keydown', onKeyDown);
};