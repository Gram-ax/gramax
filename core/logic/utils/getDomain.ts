export const getClientDomain = (): string => {
	let domain = "";
	if (typeof window !== "undefined") domain = window.location.origin;
	if (domain.includes("tauri")) domain = "https://app.gram.ax";
	return domain;
};
