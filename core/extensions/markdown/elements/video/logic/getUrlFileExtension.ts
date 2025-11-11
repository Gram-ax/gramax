export const getUrlFileExtension = (url: string): string => {
	return (
		url
			.split(".")
			.pop()
			?.replace(/[?#].*$/, "")
			.toLowerCase() || ""
	);
};
