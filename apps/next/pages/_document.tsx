import ThemeService from "@ext/Theme/components/ThemeService";
import fs from "fs";
import path from "path";
import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from "next/document";
import { OpenGraphData } from "@core/SitePresenter/SitePresenter";

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
							<meta property="og:title" content={openGraphData.title || ""} />
							<meta property="og:type" content="article" />
							<meta property="og:description" content={openGraphData.description || ""} />
							{currentUrl && <meta property="og:url" content={currentUrl} />}
							{domain && (
								<>
									<meta property="og:image" content={`${domain}${basePath}/favicon.ico`} />
									<meta property="og:image:width" content="64" />
									<meta property="og:image:height" content="64" />
								</>
							)}
						</>
					)}
					<style dangerouslySetInnerHTML={{ __html: this.props.cssContent }} />
				</Head>
				<body id="custom-style" data-theme={this.props.theme}>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
