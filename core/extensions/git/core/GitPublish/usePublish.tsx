import formatComment from "@components/Layouts/StatusBar/Extensions/logic/formatComment";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { useCallback, useMemo, useState } from "react";

export type UsePublishProps = {
	diffTree: DiffTree;
	selectedFiles: Set<string>;

	onPublished?: () => void;
};

export type UsePublish = {
	isPublishing: boolean;

	placeholder: string;
	message: string;

	publish: () => Promise<boolean>;
	setMessage: (message: string) => void;
};

const usePublish = ({ diffTree, selectedFiles, onPublished }: UsePublishProps): UsePublish => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [isPublishing, setIsPublishing] = useState(false);

	const [message, setMessage] = useState<string>(undefined);
	const messageFallback = useMemo(() => formatComment(diffTree, selectedFiles), [diffTree, selectedFiles]);

	const publish = useCallback(async () => {
		const endpoint = apiUrlCreator.getStoragePublishUrl(message?.length > 0 ? message : messageFallback);
		const files = Array.from(selectedFiles);

		setIsPublishing(true);
		const res = await FetchService.fetch(endpoint, JSON.stringify(files), MimeTypes.json);
		setIsPublishing(false);

		if (res.ok) onPublished?.();

		BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Init);
		return res.ok;
	}, [apiUrlCreator, diffTree, message, messageFallback, selectedFiles]);

	return {
		placeholder: messageFallback?.split("\n\n")[0],
		message,
		isPublishing,
		publish,

		setMessage,
	};
};

export default usePublish;
