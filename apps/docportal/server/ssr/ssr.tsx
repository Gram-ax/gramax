import OpenGraph from "@components/OpenGraph/OpenGraph";
import type { PageProps } from "@components/Pages/models/Pages";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import getPageTitle from "@core-ui/getPageTitle";
import { CacheProvider } from "@emotion/react";
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

export function renderHtml(isAdmin: boolean, data: PageProps) {
	const { appHtml, styleTags } = getRenderedHtml(isAdmin ? <Admin data={data} /> : <App initialData={data} />);
	const openGraphTags = getOpenGraphTags(data);

	return `<!doctype html>
<html lang="ru">
  <head>
    <title>${getPageTitle(data.page === "article", data.data as ArticlePageData)}</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/assets/favicon.ico" />
    ${openGraphTags}
    <style>${varsCSS}</style>
    <style>${baseCSS}</style>
    <style>${themesCSS}</style>
    ${styleTags}
    <link rel="stylesheet" href="/assets/index.css" />
    <link rel="stylesheet" href="/assets/${isAdmin ? "Admin" : "index"}.css" />
  </head>
  <body>
    <div id="root">${appHtml}</div>
  </body>
  <script>
    window.initialData = {
      data: JSON.parse(${JSON.stringify(JSON.stringify(data)).replace(/</g, "\\u003c")}),
    };
  </script>
  <script type="module" src="/assets/${isAdmin ? "Admin" : "index"}.js"></script>
</html>`;
}
