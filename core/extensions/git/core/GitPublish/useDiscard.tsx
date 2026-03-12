import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import t from "@ext/localization/locale/translate";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useCallback } from "react";

export type UseDiscard = {
	discard: (path: string[], reset: boolean) => Promise<void>;
};

export const useDiscard = (selectedFiles: Set<string>, onDiscard?: () => void): UseDiscard => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();
	const index = GitIndexService.getStatus();

	const getDeletedArticlePath = useCallback(() => {
		const pathnameData = RouterPathProvider.parsePath(router.path);
		const currentFilePath = `${pathnameData.filePath.join("/")}.md`;

		const isSelected = selectedFiles.has(currentFilePath);
		const status = index.get(`${pathnameData.itemLogicPath.join("/")}.md`);
		const isAffected = isSelected && (status === FileStatus.new || status === FileStatus.delete);

		return isAffected ? `${pathnameData.itemLogicPath.join("/")}.md` : null;
	}, [router.path, selectedFiles, index]);

	const discard = useCallback(
		async (paths: string[], reset: boolean) => {
			if (!(await confirm(t("git.discard.seletected-confirm")))) return;

			const deletedArticlePath = getDeletedArticlePath();

			const endpoint = apiUrlCreator.getVersionControlDiscardUrl(deletedArticlePath);
			const res = await FetchService.fetch(endpoint, JSON.stringify(paths), MimeTypes.json);
			if (!res.ok) return;
			const redirectPath = await res.text();
			if (deletedArticlePath && redirectPath) router.pushPath(redirectPath);
			onDiscard?.();

			ArticleUpdaterService.forceUpdate();
			BranchUpdaterService.updateBranch(
				apiUrlCreator,
				reset ? OnBranchUpdateCaller.MergeRequest : OnBranchUpdateCaller.DiscardNoReset,
			);
		},
		[apiUrlCreator, onDiscard, getDeletedArticlePath, router],
	);

	return {
		discard,
	};
};
