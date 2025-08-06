const createNameForFile = (): string => {
	const fileName = `${new Intl.DateTimeFormat(navigator.language, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date())}.wav`;
	return fileName;
};

export default createNameForFile;
