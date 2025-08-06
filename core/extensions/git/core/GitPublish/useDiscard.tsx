import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import t from "@ext/localization/locale/translate";
import { useCallback } from "react";

export type UseDiscard = {
	discard: (path: string[], reset: boolean) => Promise<void>;
};

export const useDiscard = (onDiscard?: () => void): UseDiscard => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const discard = useCallback(
		async (paths: string[], reset: boolean) => {
			if (!(await confirm(t("git.discard.seletected-confirm")))) return;

			const endpoint = apiUrlCreator.getVersionControlDiscardUrl();
			await FetchService.fetch(endpoint, JSON.stringify(paths), MimeTypes.json);
			onDiscard?.();

			ArticleUpdaterService.update(apiUrlCreator);
			BranchUpdaterService.updateBranch(
				apiUrlCreator,
				reset ? OnBranchUpdateCaller.MergeRequest : OnBranchUpdateCaller.DiscardNoReset,
			);

			refreshPage();
		},
		[apiUrlCreator, onDiscard],
	);

	return {
		discard,
	};
};
