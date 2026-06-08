import formatComment from "@components/Layouts/StatusBar/Extensions/logic/formatComment";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import { PublishEmitter } from "@ext/git/actions/Publish/logic/PublishEmitter";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
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
		const commitMessage = message?.length > 0 ? message : messageFallback;
		const files = Array.from(selectedFiles);

		setIsPublishing(true);
		const ok = await PublishEmitter.publish(apiUrlCreator, commitMessage, files);
		setIsPublishing(false);

		if (ok) onPublished?.();

		BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Publish);
		return ok;
	}, [apiUrlCreator, message, messageFallback, selectedFiles, onPublished]);

	return {
		placeholder: messageFallback?.split("\n\n")[0],
		message,
		isPublishing,
		publish,

		setMessage,
	};
};

export default usePublish;
