import ThemeService from "@ext/Theme/components/ThemeService";
import fs from "fs";
import path from "path";
import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from "next/document";

interface MyDocumentProps extends DocumentInitialProps {
	cssContent: string;
	theme?: string;
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

		return props;
	}

	render() {
		return (
			<Html>
				<Head>
					<style dangerouslySetInnerHTML={{ __html: this.props.cssContent }} />
				</Head>
				<body data-theme={this.props.theme}>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
