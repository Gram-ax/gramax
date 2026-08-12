import { getExecutingEnvironment } from "@app/resolveModule/env";
import t from "@ext/localization/locale/translate";

export default (props: { type?: string }) => {
	const isWeb = getExecutingEnvironment() === "web" || getExecutingEnvironment() === "tauri";
	const bodyKey = isWeb ? "article.custom.500.body-browser" : "article.custom.500.body";
	return `${t("article.custom.500.title")}
${props?.type === "Parse" ? t(bodyKey) : "\n\n"}
`;
};
