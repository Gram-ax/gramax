import AlertError from "@components/AlertError";
import ErrorHandler from "@ext/errorHandlers/client/components/ErrorHandler";
import t from "@ext/localization/locale/translate";

class ArticleErrorHandler extends ErrorHandler {
	override renderError() {
		return <AlertError title={t("article.error.render-failed")} error={this.state.error} />;
	}
}

export default ArticleErrorHandler;
