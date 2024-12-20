const getScale = (scale: number, maxWidth: number) => {
	return Math.round((scale / 100) * maxWidth);
};

export default getScale;
