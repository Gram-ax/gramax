import "../../core/styles/ProseMirror.css";
import "../../core/styles/admonition.css";
import "../../core/styles/article-alfabeta.css";
import "../../core/styles/article.css";
import "../../core/styles/global.css";
import "../../core/styles/swagger-ui-theme.css";

import type { Preview } from "@storybook/react";
import { rest } from "msw";
import { initialize, mswDecorator } from "msw-storybook-addon";
import GlobalContext from "../styles/decorators/GlobalContext";
import ErrorBoundaryDecorator from "storybook/styles/decorators/ErrorBoundaryDecorator";

initialize(
	{
		serviceWorker: {
			url: process.env.NODE_ENV == "development" ? "mockServiceWorker.js" : "/storybook/mockServiceWorker.js",
		},
		waitUntilReady: true,
		onUnhandledRequest: "bypass",
	},
	[
		rest.get("/api/comments/getNavigationUnresolvedCommentsCount", (_req, res, ctx) => {
			return res(ctx.status(200), ctx.json({ "": 0 }));
		})
	],
);

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: "^on[A-Z].*" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

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
		toolbar: {
			icon: "bottombar",
			items: ["true", "false"],
			title: "IsMac",
			dynamicTitle: false,
		},
	},
};

export const decorators = [mswDecorator, GlobalContext, ErrorBoundaryDecorator];

export default preview;
