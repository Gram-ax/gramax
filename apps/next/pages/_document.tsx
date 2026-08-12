import type { OpenGraphData } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { SETTINGS_STORAGE_KEY } from "@ext/settings/logic/cachedSettingsStore";
import { parseSettingsCookie } from "@ext/settings/logic/cookieStorage";
import { validateTheme } from "@ext/Theme/utils";
import fs from "fs";
import Document, { type DocumentContext, type DocumentInitialProps, Head, Html, Main, NextScript } from "next/document";
import path from "path";

interface MyDocumentProps extends DocumentInitialProps {
	cssContent: string;
	theme?: string;
	openGraphData?: OpenGraphData;
	domain?: string;
	basePath?: string;
	pageUrl?: string;
}

const baseCssContent = fs.readFileSync(path.resolve("../../core/styles/base.css"), "utf8");
const varsCssContent = fs.readFileSync(path.resolve("../../core/styles/vars.css"), "utf8");
const themesCssContent = fs.readFileSync(path.resolve("../../core/styles/themes.css"), "utf8");
const firstLoadStyles = baseCssContent + varsCssContent + themesCssContent;

type CapturedPageProps = {
	context?: {
		domain?: string;
		conf?: { basePath?: string };
		settings?: { general?: { theme?: unknown } };
	};
	openGraphData?: OpenGraphData;
	pageUrl?: string;
};

class MyDocument extends Document<MyDocumentProps> {
	static async getInitialProps(ctx: DocumentContext) {
		let pageProps: CapturedPageProps | null = null;

		// Parse the gx-settings cookie up front. It is the authoritative source
		// of user-level prefs on DocPortal — server config.yaml is shared, so
		// we never mutate pageProps from it. Theme comes from the cookie directly.
		const cookieHeader = ctx.req?.headers?.cookie;
		const settingsOverride = parseSettingsCookie(cookieHeader, SETTINGS_STORAGE_KEY);
		const cookieTheme = (settingsOverride as { general?: { theme?: unknown } } | undefined)?.general?.theme;

		const originalRenderPage = ctx.renderPage;
		ctx.renderPage = () =>
			originalRenderPage({
				enhanceApp: (App) => (props) => {
					pageProps = props.pageProps;
					return <App {...props} />;
				},
				enhanceComponent: (Component) => Component,
			});

		const initialProps = await Document.getInitialProps(ctx);
		const props: MyDocumentProps = { ...initialProps, cssContent: "" };

		props.cssContent = firstLoadStyles;
		// Cookie wins for body data-theme — pageProps.context.settings carries
		// only server-side overrides (env + stored) and may lack theme entirely.
		const themeSource = cookieTheme ?? pageProps?.context?.settings?.general?.theme;
		if (themeSource) props.theme = validateTheme(themeSource);

		if (pageProps?.context) {
			props.openGraphData = pageProps.openGraphData;
			props.domain = pageProps.context?.domain;
			props.basePath = pageProps.context?.conf?.basePath || "";
			props.pageUrl = pageProps.pageUrl;
		}

		return props;
	}

	render() {
		const { openGraphData, domain, basePath, pageUrl } = this.props;
		const currentUrl = domain && pageUrl ? domain + pageUrl : "";
		const apiUrlCreator = new ApiUrlCreator(basePath);
		const customStyleAssetLink = apiUrlCreator.getCustomStyleAsset().toString();

		return (
			<Html className={this.props.theme}>
				<Head>
					{openGraphData && (
						<>
							<meta content={openGraphData.title || ""} property="og:title" />
							<meta content="article" property="og:type" />
							<meta content={openGraphData.description || ""} property="og:description" />
							{currentUrl && <meta content={currentUrl} property="og:url" />}
							{domain && (
								<>
									<meta content={`${domain}${basePath}/favicon.ico`} property="og:image" />
									<meta content="64" property="og:image:width" />
									<meta content="64" property="og:image:height" />
								</>
							)}
						</>
					)}
					{/** biome-ignore lint/style/useNamingConvention: expected */}
					<style dangerouslySetInnerHTML={{ __html: this.props.cssContent }} />
				</Head>
				<body data-theme={this.props.theme} id="custom-style">
					<link href={customStyleAssetLink} id="custom-style-link" precedence="high" rel="stylesheet" />

					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
