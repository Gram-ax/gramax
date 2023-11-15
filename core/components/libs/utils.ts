import { LocalizedString } from "../../logic/components/tableDB/table";

export const feedbackLink = (email: string, path: string, repositoryName: string) => {
	return `mailto:${email}?subject=${encodeURIComponent(
		`Замечание к статье ${repositoryName} : ${path}`,
	)}&body=${encodeURIComponent("\r\n---ВВЕДИТЕ ТЕКСТ ЗАМЕЧАНИЯ НИЖЕ---\r\n\r\n\r\n---\r\n\r\n\r\n")}`;
};

export function getLocalizedString(localizedString: LocalizedString, lang: string): string {
	return localizedString[lang] ?? localizedString.default;
}

export const getHttpsRepositoryUrl = (repositoryUrl: string) => {
	if (!repositoryUrl) return "";
	if (!repositoryUrl.endsWith(".git")) repositoryUrl += ".git";
	if (repositoryUrl[0] === "h") return repositoryUrl;
	repositoryUrl = repositoryUrl.split(":").join("/");
	const splitRepositoryUrl = repositoryUrl.split("@");
	splitRepositoryUrl[0] = "https://";
	repositoryUrl = splitRepositoryUrl.join("");
	if (repositoryUrl === "https://") return "";
	return repositoryUrl;
};

export const getCatalogNameFromUrl = (repositoryUrl: string): string => {
	return repositoryUrl?.match(/(?:\/|:)([^\\/:]*?)(?:\.git)?$/)?.[1] ?? "";
};
