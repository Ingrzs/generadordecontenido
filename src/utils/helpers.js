
/**
 * Gets the current time as a string in HH:MM format.
 * @returns {string} The formatted timestamp.
 */
export const getCurrentTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};


/**
 * Converts multiple canvas elements to blobs and downloads them as a zip file.
 * @param {HTMLCanvasElement[]} canvases - An array of canvas elements to download.
 * @param {string} zipName - The name of the zip file (without extension).
 */
export const downloadAllAsZip = async (canvases, zipName) => {
    if (!window.JSZip) {
        alert('La librería para crear archivos ZIP no está disponible.');
        return;
    }
    const zip = new JSZip();

    for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if(blob) {
                zip.file(`${zipName}_${i + 1}.png`, blob);
            }
        } catch (error) {
            console.error(`Error al procesar el canvas ${i + 1}:`, error);
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
