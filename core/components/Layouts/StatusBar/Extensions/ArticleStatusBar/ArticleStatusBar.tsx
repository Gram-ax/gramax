import ShowPublishBar from "@components/Layouts/StatusBar/Extensions/ShowPublishBar";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import styled from "@emotion/styled";
import ProtectedBranch from "@ext/catalog/actions/ProtectedBranch";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import BranchTab from "@ext/git/actions/Branch/components/BranchTab";
import ArticlePublishTrigger from "@ext/git/actions/Publish/components/ArticlePublishTrigger";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import MergeRequestTab from "@ext/git/core/GitMergeRequest/components/MergeRequestTab";
import ShowMergeRequest from "@ext/git/core/GitMergeRequest/components/ShowMergeRequest";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import PublishTab from "@ext/git/core/GitPublish/PublishTab";
import useIsSourceDataValid from "@ext/storage/components/useIsSourceDataValid";
import { useEffect, useState } from "react";
import ConnectStorage from "../../../../../extensions/catalog/actions/ConnectStorage";
import Branch from "../../../../../extensions/git/actions/Branch/components/Branch";
import Sync from "../../../../../extensions/git/actions/Sync/components/Sync";
import IsReadOnlyHOC from "../../../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import StatusBar from "../../StatusBar";

export enum LeftNavigationTab {
	None,
	MergeRequest,
	Publish,
	Inbox,
	Branch,
}

const Wrapper = styled.div`
	max-height: min-content;

	::-webkit-scrollbar {
		display: none;
	}
	-ms-overflow-style: none;
	scrollbar-width: none;
`;

const ArticleStatusBar = ({ isStorageInitialized, padding }: { isStorageInitialized: boolean; padding?: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isDevMode] = useState(() => getIsDevMode());
	const { isNext } = usePlatform();
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const isSourceValid = useIsSourceDataValid();

	const [branch, setBranch] = useState<GitBranchData>(null);
	const [mergeRequestIsDraft, setMergeRequestIsDraft] = useState(false);
	const [mergeRequest, setMergeRequest] = useState<MergeRequest>(null);

	const [currentTab, setCurrentTab] = useState(LeftNavigationTab.None);

	const setupMergeRequestState = async (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
		if (!isDevMode || isNext) return;

		const response = await FetchService.fetch<MergeRequest | undefined>(apiUrlCreator.getDraftMergeRequest());
		const data = response.ok ? await response.json() : null;
		const mr = data || branch?.mergeRequest;

		setMergeRequestIsDraft(!!data && !branch?.mergeRequest);
		setMergeRequest(mr);

		if (mr && caller !== OnBranchUpdateCaller.DiscardNoReset && caller !== OnBranchUpdateCaller.Publish)
			setCurrentTab(LeftNavigationTab.MergeRequest);
	};

	useEffect(() => {
		const onUpdateBranch = (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
			setupMergeRequestState(branch, caller);
			if (caller === OnBranchUpdateCaller.MergeRequest) return;

			setBranch(branch);
			if (!isNext && caller === OnBranchUpdateCaller.Checkout) refreshPage();
		};

		BranchUpdaterService.addListener(onUpdateBranch);
		BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Init);

		return () => BranchUpdaterService.removeListener(onUpdateBranch);
	}, [isStorageInitialized]);

	return (
		<Wrapper>
			<MergeRequestTab
				mergeRequest={mergeRequest}
				isDraft={mergeRequestIsDraft}
				setShow={(show) => setCurrentTab(show ? LeftNavigationTab.MergeRequest : LeftNavigationTab.None)}
				show={currentTab === LeftNavigationTab.MergeRequest}
			/>
			<BranchTab
				show={currentTab === LeftNavigationTab.Branch}
				setShow={(show) => setCurrentTab(show ? LeftNavigationTab.Branch : LeftNavigationTab.None)}
				branch={branch}
				onClose={() => setCurrentTab(LeftNavigationTab.None)}
				onMergeRequestCreate={() => setupMergeRequestState(branch, OnBranchUpdateCaller.MergeRequest)}
			/>
			<PublishTab
				show={currentTab === LeftNavigationTab.Publish}
				setShow={(show) => setCurrentTab(show ? LeftNavigationTab.Publish : LeftNavigationTab.None)}
			/>
			<StatusBar
				padding={padding}
				leftElements={
					isStorageInitialized
						? [
								<Branch
									key={0}
									show={currentTab === LeftNavigationTab.Branch}
									branch={branch}
									onClick={() =>
										setCurrentTab(
											currentTab === LeftNavigationTab.Branch
												? LeftNavigationTab.None
												: LeftNavigationTab.Branch,
										)
									}
								/>,
								<ShowMergeRequest
									key={1}
									mergeRequest={mergeRequest}
									isShow={currentTab === LeftNavigationTab.MergeRequest}
									setShow={() =>
										setCurrentTab(
											currentTab === LeftNavigationTab.MergeRequest
												? LeftNavigationTab.None
												: LeftNavigationTab.MergeRequest,
										)
									}
								/>,
						  ]
						: []
				}
				rightElements={
					!isStorageInitialized
						? [<ConnectStorage key={0} />]
						: [
								<Sync key={0} style={{ height: "100%" }} />,
								!isNext && isReadOnly && <ProtectedBranch key={1} />,
								<IsReadOnlyHOC key={2}>
									{isDevMode ? (
										<ShowPublishBar
											isShow={currentTab === LeftNavigationTab.Publish}
											onClick={() => {
												setCurrentTab(
													currentTab === LeftNavigationTab.Publish
														? LeftNavigationTab.None
														: LeftNavigationTab.Publish,
												);
											}}
										/>
									) : (
										<ArticlePublishTrigger
											onDiscard={() =>
												BranchUpdaterService.updateBranch(
													apiUrlCreator,
													OnBranchUpdateCaller.Init,
												)
											}
											onPublish={() =>
												BranchUpdaterService.updateBranch(
													apiUrlCreator,
													OnBranchUpdateCaller.Init,
												)
											}
										/>
									)}
								</IsReadOnlyHOC>,
						  ]
				}
			/>
		</Wrapper>
	);
};

export default ArticleStatusBar;
