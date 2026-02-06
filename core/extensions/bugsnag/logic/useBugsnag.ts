import PageDataContext from "@core/Context/PageDataContext";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import parseContent from "@ext/bugsnag/logic/parseContent";
import sendBug from "@ext/bugsnag/logic/sendBug";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import { JSONContent } from "@tiptap/core";
import { useCallback } from "react";

export const useBugsnag = (itemLogicPath: string) => {
	const apiUrlCreator = ApiUrlCreator.value;
	const pageDataContext = PageDataContextService.value;

	const getPageData = useCallback(async (): Promise<JSONContent> => {
		const res = await FetchService.fetch(apiUrlCreator.getPageData(itemLogicPath));
		if (!res.ok) return;
		const pageData = await res.json();
		return JSON.parse(pageData.data.articleContentEdit);
	}, [itemLogicPath, apiUrlCreator]);

	const getDetails = useCallback((props: { editTree: JSONContent; context?: PageDataContext }) => {
		const { editTree, context } = props;
		const result: { replacedArticle?: JSONContent; context?: any; gitLogs?: any } = {};

		if (editTree) result.replacedArticle = parseContent(editTree);

		if (context && context.conf) {
			const conf = { branch: context.conf?.isRelease, version: context.conf?.version };
			result.context = { ...context, sourceDatas: null, userInfo: null, conf };
		}

		if (PersistentLogger) {
			const gitLogs = PersistentLogger.getLogs(/git/, 100);
			result.gitLogs = gitLogs;
		}

		return result;
	}, []);

	const getTechDetails = useCallback(async () => {
		const editTree = await getPageData();
		return getDetails({ editTree, context: pageDataContext });
	}, [getPageData, getDetails, pageDataContext]);

	const sendLogsHandler = useCallback(
		async (comment: string, editTree: JSONContent) => {
			const details = getDetails({ editTree, context: pageDataContext });
			const logs = { comment, ...details };
			try {
				await sendBug(
					new Error("Пользовательская ошибка"),
					(e) => {
						e.addMetadata("props", logs);
					},
					false,
				);
			} catch (e) {
				console.error(e);
				ErrorConfirmService.notify(
					new DefaultError(
						t("bug-report.error.cannot-send-feedback.message"),
						null,
						null,
						false,
						t("bug-report.error.cannot-send-feedback.title"),
					),
				);
			}
		},
		[getDetails, pageDataContext],
	);

	const onSubmit = useCallback(
		async (data: { description?: string; bAttach?: boolean }) => {
			const editTree = data.bAttach ? await getPageData() : null;
			await sendLogsHandler(data.description || "", editTree);
		},
		[getPageData, sendLogsHandler],
	);

	return { onSubmit, getTechDetails };
};
