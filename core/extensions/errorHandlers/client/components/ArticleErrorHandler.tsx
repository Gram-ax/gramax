import AlertError from "@components/AlertError";
import ErrorHandler from "@ext/errorHandlers/client/components/ErrorHandler";
import t from "@ext/localization/locale/translate";
import Header from "@ext/markdown/elements/heading/render/components/Header";

class ArticleErrorHandler extends ErrorHandler {
	override renderError() {
		return (
			<>
				<Header copyLinkIcon={false} level={1}>
					{t("article.error.render-failed")}
				</Header>
				<div className="article">
					<div className="article-body">
						<AlertError
							error={{
								message: t("app.error.command-failed.body"),
								stack: this.state.error.stack,
							}}
							isHtmlMessage={true}
							title={t("app.error.something-went-wrong")}
						/>
					</div>
				</div>
			</>
		);
	}
}

export default ArticleErrorHandler;
