import { getExecutingEnvironment } from "@app/resolveModule/env";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import ArticlePublishTrigger from "@ext/git/actions/Publish/components/ArticlePublishTrigger";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import MergeRequestView from "@ext/git/core/GitMergeRequest/components/MergeRequestView";
import ShowMergeRequest from "@ext/git/core/GitMergeRequest/components/ShowMergeRequest";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { useEffect, useState } from "react";
import ConnectStorage from "../../../../extensions/catalog/actions/ConnectStorage";
import Branch from "../../../../extensions/git/actions/Branch/components/Branch";
import Sync from "../../../../extensions/git/actions/Sync/components/Sync";
import IsReadOnlyHOC from "../../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import StatusBar from "../StatusBar";

const ArticleStatusBar = ({ isStorageInitialized, padding }: { isStorageInitialized: boolean; padding?: string }) => {
	const changesCount: number = null;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [branch, setBranch] = useState<GitBranchData>(null);
	const [mergeRequestIsDraft, setMergeRequestIsDraft] = useState(false);
	const [mergeRequest, setMergeRequest] = useState<MergeRequest>(null);
	const [showMergeRequest, setShowMergeRequest] = useState(true);

	const setupMergeRequestState = async (branch: GitBranchData) => {
		if (!getIsDevMode() || getExecutingEnvironment() === "next") return;

		const response = await FetchService.fetch<MergeRequest | undefined>(apiUrlCreator.getDraftMergeRequest());
		const data = response.ok ? await response.json() : null;
		setMergeRequestIsDraft(!!data && !branch?.mergeRequest);
		setMergeRequest(data || branch?.mergeRequest);
	};

	useEffect(() => {
		const onUpdateBranch = (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
			setupMergeRequestState(branch);
			if (caller === OnBranchUpdateCaller.MergeRequest) return;

			setBranch(branch);
			if (getExecutingEnvironment() !== "next" || caller === OnBranchUpdateCaller.Checkout) refreshPage();
		};

		BranchUpdaterService.addListener(onUpdateBranch);
		BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Init);

		return () => BranchUpdaterService.removeListener(onUpdateBranch);
	}, [isStorageInitialized]);

	return (
		<>
			<MergeRequestView
				mergeRequest={mergeRequest}
				isDraft={mergeRequestIsDraft}
				setShow={setShowMergeRequest}
				show={showMergeRequest}
			/>
			<StatusBar
				padding={padding}
				leftElements={
					isStorageInitialized
						? [
								<Branch
									key={0}
									branch={branch}
									onMergeRequestCreate={() => setupMergeRequestState(branch)}
								/>,
								<ShowMergeRequest
									key={1}
									mergeRequest={mergeRequest}
									isShow={showMergeRequest}
									setShow={setShowMergeRequest}
								/>,
						  ]
						: []
				}
				rightElements={
					!isStorageInitialized
						? [<ConnectStorage key={0} />]
						: [
								<Sync key={0} style={{ height: "100%" }} />,
								<IsReadOnlyHOC key={1}>
									<ArticlePublishTrigger
										changesCount={changesCount}
										onDiscard={() =>
											BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Init)
										}
										onPublish={() =>
											BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Init)
										}
									/>
								</IsReadOnlyHOC>,
						  ]
				}
			/>
		</>
	);
};

export default ArticleStatusBar;
