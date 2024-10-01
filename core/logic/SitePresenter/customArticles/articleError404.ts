import { getExecutingEnvironment } from "@app/resolveModule/env";
import t from "@ext/localization/locale/translate";

export default (props: { pathname?: string }) =>
	`---
title: ${t("article.custom.404.title.article")}
---

[alert:warning:${t("article.custom.404.alert-title")}]
${t("article.custom.404.pathname").replaceAll("{{pathname}}", props.pathname)}

${
	getExecutingEnvironment() === "browser"
		? t("article.custom.404.open-in-desktop").replaceAll("{{pathname}}", props.pathname)
		: ""
}
[/alert]
`;
