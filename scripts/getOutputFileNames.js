const getOutputFileNames = (assetsDir = "assets") => {
	return {
		entryFileNames: () => {
			return `${assetsDir}/[name]-[hash].js`;
		},
		chunkFileNames: () => {
			return `${assetsDir}/[name]-[hash].js`;
		},
		assetFileNames: () => {
			return `${assetsDir}/[name]-[hash][extname]`;
		},
	};
};

export default getOutputFileNames;
