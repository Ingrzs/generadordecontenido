
/**
 * Gets the current time as a string in HH:MM format.
 * @returns {string} The formatted timestamp.
 */
export const getCurrentTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};


/**
 * Converts multiple HTML elements to blobs via html2canvas and downloads them as a zip file.
 * @param {HTMLElement[]} elements - An array of HTML elements to capture and download.
 * @param {string} zipName - The name of the zip file (without extension).
 */
export const downloadAllAsZip = async (elements, zipName) => {
    if (!window.JSZip || !window.html2canvas) {
        alert('Las librerías para crear archivos ZIP o para generar imágenes no están disponibles.');
        return;
    }
    const zip = new JSZip();

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        try {
            // Generate canvas from the element on the fly
            const canvas = await html2canvas(element, { useCORS: true, backgroundColor: '#ffffff' });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if(blob) {
                zip.file(`${zipName}_${i + 1}.png`, blob);
            }
        } catch (error) {
            console.error(`Error al procesar el elemento ${i + 1}:`, error);
        }
    }

    try {
        const zipContent = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = `${zipName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error al generar el archivo ZIP:', error);
        alert('No se pudo generar el archivo ZIP.');
    }
};
