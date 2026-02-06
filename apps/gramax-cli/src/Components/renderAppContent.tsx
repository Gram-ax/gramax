import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import createEmotionCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import ReactDOMServer from "react-dom/server";
import { Router } from "wouter";
import Gramax from "./../../../browser/src/Gramax";

const convertEmotionStylesToString = (styles: Record<string, string>): string => {
	if (typeof window === "undefined") return "";
	const styleContent = Object.entries(styles)
		.map(([className, rules]) => `.${className}{${rules.replace(/\s+/g, " ")}}`)
		.join("");

	return `<style>${styleContent}</style>`;
};

export const renderAppContent = (data: ArticlePageData, context: PageDataContext) => {
	const emotionCache = createEmotionCache({
		key: "css",
		prepend: true,
		container: undefined,
	});
	const body = ReactDOMServer.renderToString(
		<CacheProvider value={emotionCache}>
			<Router base="./" ssrPath={data.articleProps.logicPath}>
				<Gramax
					data={{
						data: {
							articleContentEdit: "",
							...data,
						},
						context,
						path: data.articleProps.logicPath,
					}}
					platform="cli"
					setData={() => {}}
				/>
			</Router>
		</CacheProvider>,
	);
	return {
		body,
		styles: convertEmotionStylesToString(emotionCache.registered),
	};
};
