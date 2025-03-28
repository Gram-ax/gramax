import { getExecutingEnvironment } from "@app/resolveModule/env";
import ShowPublishBar from "@components/Layouts/StatusBar/Extensions/ShowPublishBar";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import styled from "@emotion/styled";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import ArticlePublishTrigger from "@ext/git/actions/Publish/components/ArticlePublishTrigger";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import MergeRequestTab from "@ext/git/core/GitMergeRequest/components/MergeRequestTab";
import ShowMergeRequest from "@ext/git/core/GitMergeRequest/components/ShowMergeRequest";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import PublishTab from "@ext/git/core/GitPublish/PublishTab";
import { useEffect, useState } from "react";
import ConnectStorage from "../../../../../extensions/catalog/actions/ConnectStorage";
import Branch from "../../../../../extensions/git/actions/Branch/components/Branch";
import Sync from "../../../../../extensions/git/actions/Sync/components/Sync";
import IsReadOnlyHOC from "../../../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import StatusBar from "../../StatusBar";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import BranchTab from "@ext/git/actions/Branch/components/BranchTab";
import ProtectedBranch from "@ext/catalog/actions/ProtectedBranch";
import { usePlatform } from "@core-ui/hooks/usePlatform";

export enum StatusBarTab {
	None,
	MergeRequest,
	Publish,
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

	const [branch, setBranch] = useState<GitBranchData>(null);
	const [mergeRequestIsDraft, setMergeRequestIsDraft] = useState(false);
	const [mergeRequest, setMergeRequest] = useState<MergeRequest>(null);

	const [currentTab, setCurrentTab] = useState(StatusBarTab.None);

	const setupMergeRequestState = async (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
		if (!isDevMode || isNext) return;

		const response = await FetchService.fetch<MergeRequest | undefined>(apiUrlCreator.getDraftMergeRequest());
		const data = response.ok ? await response.json() : null;
		const mr = data || branch?.mergeRequest;

		setMergeRequestIsDraft(!!data && !branch?.mergeRequest);
		setMergeRequest(mr);

		if (mr && caller !== OnBranchUpdateCaller.DiscardNoReset) setCurrentTab(StatusBarTab.MergeRequest);
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
				setShow={(show) => setCurrentTab(show ? StatusBarTab.MergeRequest : StatusBarTab.None)}
				show={currentTab === StatusBarTab.MergeRequest}
			/>
			<BranchTab
				show={currentTab === StatusBarTab.Branch}
				setShow={(show) => setCurrentTab(show ? StatusBarTab.Branch : StatusBarTab.None)}
				branch={branch}
				onClose={() => setCurrentTab(StatusBarTab.None)}
				onMergeRequestCreate={() => setupMergeRequestState(branch, OnBranchUpdateCaller.MergeRequest)}
			/>
			<PublishTab
				show={currentTab === StatusBarTab.Publish}
				setShow={(show) => setCurrentTab(show ? StatusBarTab.Publish : StatusBarTab.None)}
			/>
			<StatusBar
				padding={padding}
				leftElements={
					isStorageInitialized
						? [
								<Branch
									key={0}
									show={currentTab === StatusBarTab.Branch}
									branch={branch}
									onClick={() =>
										setCurrentTab(
											currentTab === StatusBarTab.Branch
												? StatusBarTab.None
												: StatusBarTab.Branch,
										)
									}
								/>,
								<ShowMergeRequest
									key={1}
									mergeRequest={mergeRequest}
									isShow={currentTab === StatusBarTab.MergeRequest}
									setShow={() =>
										setCurrentTab(
											currentTab === StatusBarTab.MergeRequest
												? StatusBarTab.None
												: StatusBarTab.MergeRequest,
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
											isShow={currentTab === StatusBarTab.Publish}
											onClick={() => {
												setCurrentTab(
													currentTab === StatusBarTab.Publish
														? StatusBarTab.None
														: StatusBarTab.Publish,
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
