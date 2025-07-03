import AlertError from "@components/AlertError";
import ErrorHandler from "@ext/errorHandlers/client/components/ErrorHandler";
import t from "@ext/localization/locale/translate";
import Header from "@ext/markdown/elements/heading/render/component/Header";

class ArticleErrorHandler extends ErrorHandler {
	override renderError() {
		return (
			<>
				<Header level={1} copyLinkIcon={false}>
					{t("article.error.render-failed")}
				</Header>
				<div className="article">
					<div className="article-body">
						<AlertError
							title={t("app.error.something-went-wrong")}
							error={{
								message: t("app.error.command-failed.body"),
								stack: this.state.error.stack,
							}}
							isHtmlMessage={true}
						/>
					</div>
				</div>
			</>
		);
	}
}

export default ArticleErrorHandler;
