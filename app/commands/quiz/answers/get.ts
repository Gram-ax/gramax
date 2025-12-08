import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { CheckAnswer } from "@ext/markdown/elements/answer/types";
import { getArticleId, getTestId } from "@ext/quiz/logic/getIds";
import { QuizTestCreate } from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import assert from "assert";
import { QuizResult } from "@ext/quiz/models/types";
import { getQuizResult } from "@ext/quiz/logic/getQuizResult";

const get: Command<{ ctx: Context; catalogName: string; articlePath: Path; answers: CheckAnswer[] }, QuizResult> =
	Command.create({
		path: "quiz/answers/get",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, articlePath, answers }) {
			const { wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();
			const config = await workspace.config();

			if (!config.enterprise?.gesUrl && !config.gesUrl) return { passed: false, questions: [] };
			if (!config.enterprise?.modules?.quiz) return { passed: false, questions: [] };

			const catalog = await workspace.getCatalog(catalogName, ctx);
			assert(catalog, "Catalog not found");

			const article = catalog.findItemByItemPath<Article>(articlePath);
			if (!article) return { passed: false, questions: [] };

			if (await article.parsedContent.isNull()) {
				await parseContent(article, catalog, ctx, parser, parserContextFactory);
			}

			const questions = await article.parsedContent.read((p) => p?.questions);
			if (!questions) return { passed: false, questions: [] };

			const quizSettings = article.props.quiz;
			const results = getQuizResult(questions, answers, quizSettings);

			const gvc = catalog.repo.gvc;
			if (!gvc) return results;

			const articleId = getArticleId(article);
			const testId = await getTestId(articleId, gvc);
			const exist = await this._commands.enterprise.quiz.test.exist.do({
				ctx,
				workspaceId: workspace.path(),
				testId,
			});

			if (!exist) {
				const test: QuizTestCreate = {
					id: testId,
					articleId,
					title: article.getTitle(),
					questions: Array.from(questions.values()).map((question) => ({
						id: question.id,
						title: question.title,
						answers: Object.values(question.answers).map((answer) => ({
							id: answer.id,
							title: answer.title,
							correct: answer.correct,
						})),
					})),
				};

				await this._commands.enterprise.quiz.test.add.do({
					ctx,
					workspaceId: workspace.path(),
					test,
				});
			}

			await this._commands.enterprise.quiz.answer.add.do({
				ctx,
				workspaceId: workspace.path(),
				answer: {
					test_id: testId,
					user_mail: ctx.user.info.mail,
					answers: answers,
				},
			});

			return results;
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const articlePath = new Path(q.articlePath);
			const answers = body.answers;
			return { ctx, catalogName, articlePath, answers };
		},
	});

export default get;
