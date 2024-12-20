const getNaturalSize = (buffer: string): Promise<{ width: number; height: number }> => {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.src = buffer;
		image.onload = () => {
			resolve({ width: image.naturalWidth, height: image.naturalHeight });
		};
		image.onerror = (error) => {
			reject(error);
		};
	});
};

export default getNaturalSize;
