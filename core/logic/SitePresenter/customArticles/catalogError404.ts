import { getExecutingEnvironment } from "@app/resolveModule/env";
import safeDecode from "@core/utils/safeDecode";
import t from "@ext/localization/locale/translate";

export default (props: { pathname?: string }) =>
	`---
title: ${t("article.custom.404.title.catalog")}
---

[alert:warning:${t("article.custom.404.alert-title")}]
${t("article.custom.404.pathname").replaceAll("{{pathname}}", safeDecode(props.pathname))}${
	getExecutingEnvironment() === "browser"
		? ". " + t("article.custom.404.open-in-desktop").replaceAll("{{pathname}}", safeDecode(props.pathname))
		: ""
}
[/alert]
`;
