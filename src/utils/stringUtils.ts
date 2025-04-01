/**
 * Cleans a destination string by:
 * 1. Removing country name (after comma)
 * 2. Removing PIN codes and numbers
 * 3. Removing extra spaces
 * 4. Trimming whitespace
 */
export const cleanDestination = (destination: string): string => {
    if (!destination) return '';

    // First split by comma and take the first part
    const mainPart = destination.split(',')[0].trim();

    // Remove any numbers and extra spaces
    return mainPart.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
}; 