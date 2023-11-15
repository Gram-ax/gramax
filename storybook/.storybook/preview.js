import ContextProvider from "@components/ContextProviders";
import "@fortawesome/fontawesome-pro/css/all.css";
import { initialize, mswDecorator } from "msw-storybook-addon";
import React from "react";
import ErrorBoundary from "../../core/extensions/errorHandlers/client/components/ErrorBoundary";
import "../../core/styles/ProseMirror.css";
import "../../core/styles/admonition.css";
import "../../core/styles/article-alfabeta.css";
import "../../core/styles/article.css";
import "../../core/styles/global.css";
import "../../core/styles/swagger-ui-theme.css";
import pageProps from "../data/pageProps.json";
import getBasePath from "../logic/getBasePath";
import ChangeContext from "../logic/theme/ThemeProvider";

initialize({
	serviceWorker: {
		url: `${getBasePath()}/mockServiceWorker.js`,
	},
});

export const globalTypes = {
	theme: {
		name: "Theme",
		description: "Theme for components",
		defaultValue: "light",
		toolbar: {
			icon: "circlehollow",
			items: ["light", "dark"],
			title: true,
			dynamicTitle: true,
		},
	},
	lang: {
		name: "Language",
		description: "Language for components",
		defaultValue: "ru",
		toolbar: {
			icon: "globe",
			items: ["ru", "en"],
			dynamicTitle: true,
		},
	},
	isMac: {
		name: "Mac",
		description: "Is Mac for components",
		defaultValue: "false",
		toolbar: {
			icon: "bottombar",
			items: ["true", "false"],
			title: "IsMac",
			dynamicTitle: false,
		},
	},
};

export const decorators = [
	(Story, context) => {
		ChangeContext(context.globals);
		pageProps.theme = context.globals.theme;
		pageProps.lang = context.globals.lang;
		pageProps.isMac = context.globals.isMac === "true";

		// document.getElementById("root").style.height = "100%";
		return (
			<>
				<div style={{ height: "100%" }}>
					<ContextProvider pageProps={pageProps} isArticlePage={true} basePath={getBasePath()}>
						<ErrorBoundary context={pageProps.context}>
							<Story />
						</ErrorBoundary>
					</ContextProvider>
				</div>
			</>
		);
	},
	mswDecorator,
];
