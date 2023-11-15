export const generateNewDate = () => {
	return dateScreening(new Date().toJSON());
};

export const dateScreening = (date: string): string => {
	if (!date) return;
	return date.replaceAll(":", "|");
};

export const dateNormalize = (date: string): string => {
	if (!date) return;
	return date.replaceAll("|", ":");
};
