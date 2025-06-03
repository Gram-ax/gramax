import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageInitialized";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useEffect, useState } from "react";

const useIsFileNew = (item: ClientArticleProps) => {
	const { isReadOnly } = PageDataContext.value.conf;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const hasRemoteStorage = useHasRemoteStorage();
	const isStorageInitialized = useIsStorageInitialized();

	const [isFileNew, setIsFileNew] = useState(false);

	const getIsFileNew = async () => {
		const res = await FetchService.fetch<GitStatus>(apiUrlCreator.getVersionControlFileStatus(item.ref.path));
		const gitStatus = await res.json();
		setIsFileNew(!gitStatus || gitStatus.status == FileStatus.new);
	};

	useEffect(() => {
		if (!hasRemoteStorage || !isStorageInitialized || isReadOnly || !item?.logicPath) return;
		void getIsFileNew();
	}, [item?.logicPath, hasRemoteStorage, isStorageInitialized, isReadOnly]);

	useEffect(() => {
		const handler = async (_, caller: OnBranchUpdateCaller) => {
			if (caller !== OnBranchUpdateCaller.Publish) return;
			await getIsFileNew();
		};
		BranchUpdaterService.addListener(handler);
		return () => BranchUpdaterService.removeListener(handler);
	}, [apiUrlCreator, item?.logicPath]);

	return isFileNew;
};

export default useIsFileNew;
