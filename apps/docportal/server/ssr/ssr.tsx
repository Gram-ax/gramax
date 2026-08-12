import OpenGraph from "@components/OpenGraph/OpenGraph";
import type { PageProps } from "@components/Pages/models/Pages";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import getPageTitle from "@core-ui/getPageTitle";
import { CacheProvider } from "@emotion/react";
import { validateTheme } from "@ext/Theme/utils";
import fs from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import { Admin } from "../../client/components/Admin";
import { App } from "../../client/components/App";
import styles from "./styled";

const rootDir = path.resolve(import.meta.dir, "../../..");
const baseCSS = fs.readFileSync(path.join(rootDir, "core/styles/base.css"), "utf-8");
const varsCSS = fs.readFileSync(path.join(rootDir, "core/styles/vars.css"), "utf-8");
const themesCSS = fs.readFileSync(path.join(rootDir, "core/styles/themes.css"), "utf-8");

const safeJsonInScript = (value: unknown): string => JSON.stringify(value).replace(/</g, "\\u003c");

const getRenderedHtml = (component: React.ReactNode) => {
	const appHtml = renderToString(<CacheProvider value={styles.cache}>{component}</CacheProvider>);
	const chunks = styles.extractCriticalToChunks(appHtml);
	const styleTags = styles.constructStyleTagsFromChunks(chunks);

	return { appHtml, styleTags };
};

const getOpenGraphTags = (data: PageProps) => {
	return data.page === "article" && data.data.mode === "read"
		? renderToString(<OpenGraph domain={data.context.domain} openGraphData={data.data.openGraphData} />)
		: "";
};

const getSeoTags = (data: PageProps) => {
	return data.page === "article" && data.data.mode === "read"
		? renderToString(<meta content={data.data.articleProps.description} name="description" />)
		: "";
};

export function renderHtml(isAdmin: boolean, data: PageProps) {
	const theme = validateTheme(data.context.settings?.general?.theme);
	const basePath = data.context.conf.basePath ?? "";
	const apiUrlCreator = new ApiUrlCreator(basePath);
	const customStyleAssetLink = apiUrlCreator.getCustomStyleAsset().toString();

	const { appHtml, styleTags } = getRenderedHtml(isAdmin ? <Admin data={data} /> : <App initialData={data} />);
	const openGraphTags = getOpenGraphTags(data);
	const seoTags = getSeoTags(data);

	return `<!doctype html>
<html lang="ru" class=${theme}>
  <head>
    <title>${isAdmin ? "Admin" : getPageTitle(data)}</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="${basePath}/assets/favicon.ico" />
    ${openGraphTags}
    ${seoTags}
    <style>${varsCSS}</style>
    <style>${baseCSS}</style>
    <style>${themesCSS}</style>
    <link rel="stylesheet" href="${basePath}/assets/index.css" />
    <link rel="stylesheet" href="${basePath}/assets/tailwind.css" />
    <link rel="stylesheet" href="${basePath}/assets/${isAdmin ? "Admin" : "index"}.css" />
    ${styleTags}
    <link href=${customStyleAssetLink} id="custom-style-link" rel="stylesheet" />
  </head>
  <body data-theme=${theme}>
    <div id="root">${appHtml}</div>
  </body>
  <script>
    window.__BASE_PATH__ = ${safeJsonInScript(basePath)};
    window.initialData = {
      data: JSON.parse(${safeJsonInScript(JSON.stringify(data))}),
    };
  </script>
  <script type="module" src="${basePath}/assets/${isAdmin ? "Admin" : "index"}.js"></script>
</html>`;
}
