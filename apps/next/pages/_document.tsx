import { OpenGraphData } from "@core/SitePresenter/SitePresenter";
import ThemeService from "@ext/Theme/components/ThemeService";
import fs from "fs";
import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from "next/document";
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

class MyDocument extends Document<MyDocumentProps> {
	static async getInitialProps(ctx: DocumentContext) {
		let pageProps = null;

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

		if (!pageProps?.context) return props;

		let theme = pageProps.context.theme;
		if (typeof theme !== "string") theme = "";
		props.theme = ThemeService.checkTheme(theme);

		props.openGraphData = pageProps.openGraphData;
		props.domain = pageProps.context?.domain;
		props.basePath = pageProps.context?.conf?.basePath || "";
		props.pageUrl = pageProps.pageUrl;

		return props;
	}

	render() {
		const { openGraphData, domain, basePath, pageUrl } = this.props;
		const currentUrl = domain && pageUrl ? domain + pageUrl : "";

		return (
			<Html>
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
					<style dangerouslySetInnerHTML={{ __html: this.props.cssContent }} />
				</Head>
				<body data-theme={this.props.theme} id="custom-style">
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
