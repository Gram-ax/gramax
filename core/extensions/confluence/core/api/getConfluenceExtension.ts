const getConfluenceExtension = (title: string): { fileNameWithoutExtension: string; extension: string | null } => {
	const lastDot = title.lastIndexOf(".");
	return lastDot > 0
		? {
				fileNameWithoutExtension: title.substring(0, lastDot),
				extension: title.substring(lastDot + 1),
		  }
		: {
				fileNameWithoutExtension: title,
				extension: null,
		  };
};

export default getConfluenceExtension;
