import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { getArticleId, getTestId } from "@ext/quiz/logic/getIds";
import assert from "assert";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getQuizResult } from "@ext/quiz/logic/getQuizResult";
import { StoredQuizResult } from "@ext/quiz/models/types";

const getTestResult: Command<{ ctx: Context; catalogName: string; articlePath: Path }, StoredQuizResult> =
	Command.create({
		path: "quiz/getTestResult",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, articlePath }) {
			const { wm } = this._app;
			const workspace = wm.current();
			const config = await workspace.config();

			if (!config.enterprise?.gesUrl && !config.gesUrl)
				return { passed: null, questions: [], selectedAnswers: {} };
			if (!config.enterprise?.modules?.quiz) return { passed: null, questions: [], selectedAnswers: {} };

			const catalog = await workspace.getCatalog(catalogName, ctx);
			assert(catalog, "Catalog not found");

			const article = catalog.findItemByItemPath<Article>(articlePath);
			if (!article) return { passed: null, questions: [], selectedAnswers: {} };

			const gvc = catalog.repo.gvc;
			if (!gvc) return { passed: null, questions: [], selectedAnswers: {} };

			const gesUrl = config.enterprise?.gesUrl;
			const sourceDatas = this._app.rp.getSourceDatas(ctx, workspace.path());
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);
			if (!gesUrl || !enterpriseSource) return { passed: null, questions: [], selectedAnswers: {} };

			const mail = ctx.user.info.mail;
			if (!mail) return { passed: null, questions: [], selectedAnswers: {} };

			const articleId = getArticleId(article);
			const testId = await getTestId(articleId, gvc);

			const answers = await new EnterpriseApi(gesUrl).getQuizTestByUser(enterpriseSource.token, testId, mail);
			if (!answers?.length) return { passed: null, questions: [], selectedAnswers: {} };

			const questions = await article.parsedContent.read((p) => p?.questions);
			const results = getQuizResult(questions, answers, article.props.quiz);
			return {
				passed: results.passed,
				countOfCorrectAnswers: results.countOfCorrectAnswers,
				questions: results.questions,
				selectedAnswers: Object.fromEntries(
					answers.map((answer) => [answer.questionId, answer.answersIds]),
				) as Record<string, string[]>,
			};
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const articlePath = new Path(q.articlePath);
			return { ctx, catalogName, articlePath };
		},
	});

export default getTestResult;
