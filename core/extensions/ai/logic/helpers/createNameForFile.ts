const createNameForFile = (extension: string = "wav"): string => {
	const fileName = `${new Intl.DateTimeFormat(navigator.language, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	})
		.format(new Date())
		.replace(/:/g, ".")}.${extension}`;
	return fileName;
};

export default createNameForFile;
