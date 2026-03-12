import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { getArticleId, getTestId } from "@ext/quiz/logic/getIds";
import { getQuizResult } from "@ext/quiz/logic/getQuizResult";
import type { StoredQuizResult } from "@ext/quiz/models/types";
import assert from "assert";

const getTestResult: Command<{ ctx: Context; catalogName: string; articlePath: Path }, StoredQuizResult> =
	Command.create({
		path: "quiz/getTestResult",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, articlePath }) {
			const { wm } = this._app;
			const workspace = wm.current();
			const config = await workspace.config();

			if (!config.enterprise?.gesUrl && !config.gesUrl) return null;
			if (!config.enterprise?.modules?.quiz) return null;

			const catalog = await workspace.getCatalog(catalogName, ctx);
			assert(catalog, "Catalog not found");

			const article = catalog.findItemByItemPath<Article>(articlePath);
			if (!article) return null;

			const gvc = catalog.repo.gvc;
			if (!gvc) return null;

			const gesUrl = config.enterprise?.gesUrl;
			const sourceDatas = this._app.rp.getSourceDatas(ctx, workspace.path());
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);
			if (!gesUrl || !enterpriseSource) return null;

			const mail = ctx.user.info.mail;
			if (!mail) return null;

			const articleId = getArticleId(article);
			const testId = await getTestId(articleId, gvc);

			const answers = await new EnterpriseApi(gesUrl).getQuizTestByUser(enterpriseSource.token, testId, mail);
			if (!answers?.length) return null;

			const questions = await article.parsedContent.read((p) => p?.parsedContext?.questions);
			const results = getQuizResult(questions, answers, article.props.quiz);
			return {
				passed: results.passed,
				countOfCorrectAnswers: article.props.quiz?.countOfCorrectAnswers
					? results.countOfCorrectAnswers
					: undefined,
				questions: article.props.quiz?.countOfCorrectAnswers ? results.questions : [],
				selectedAnswers: answers,
			};
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const articlePath = new Path(q.articlePath);
			return { ctx, catalogName, articlePath };
		},
	});

export default getTestResult;
