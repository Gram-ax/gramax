export const browserLoadFont = async (fontPath: string): Promise<ArrayBuffer> => {
	try {
		const response = await fetch(`/fonts/${fontPath}`);
		return await response.arrayBuffer();
	} catch (error) {
		console.error(`Error loading font ${fontPath}:`, error);
	}
};
