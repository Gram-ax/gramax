import t from "@ext/localization/locale/translate";

export default (props: { type?: string }) => `${t("article.custom.500.title")}
${props?.type == "Parse" ? t("article.custom.500.body") : "\n\n"}
`;
