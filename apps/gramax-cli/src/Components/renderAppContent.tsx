import createEmotionCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { StaticRouter } from "react-router-dom/server";
import ReactDOMServer from "react-dom/server";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContext from "@core/Context/PageDataContext";
import App from "./App";

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
			<StaticRouter location={"/"}>
				<App
					data={{
						articleContentEdit: "",
						...data,
					}}
					context={context}
					platform="cli"
				/>
			</StaticRouter>
		</CacheProvider>,
	);
	return {
		body,
		styles: convertEmotionStylesToString(emotionCache.registered),
	};
};
