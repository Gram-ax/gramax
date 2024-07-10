const getImageSize = (src: string, onload: (size: { w; h }) => void) => {
	const img = new Image();
	img.onload = (e) => {
		const target = e.target as HTMLImageElement;
		onload({ w: target.width, h: target.height });
		img.remove();
	};
	img.src = src;
};

export default getImageSize;
