import t from "@ext/localization/locale/translate";

export default (props: { pathname?: string }) =>
	t("article.custom.404.body")
		.replace("{{what}}", t("article.custom.404.article.name"))
		.replace(
			"{{pathname}}",
			props?.pathname ? t("article.custom.404.article.body").replace("{{pathname}}", props.pathname) : "",
		);
