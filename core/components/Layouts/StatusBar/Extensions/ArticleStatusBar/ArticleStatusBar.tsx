/** biome-ignore-all lint/correctness/useExhaustiveDependencies: ?? */

import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import ShowPublishBar from "@components/Layouts/StatusBar/Extensions/ShowPublishBar";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import ProtectedBranch from "@ext/catalog/actions/ProtectedBranch";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import BranchTab from "@ext/git/actions/Branch/components/BranchTab";
import RepositoryBroken from "@ext/git/actions/RepositoryBroken";
import RevisionsTab from "@ext/git/actions/Revisions/components/RevisionsTab/RevisionsTab";
import ShowRevisionsTab from "@ext/git/actions/Revisions/components/RevisionsTab/ShowRevisionsTab";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import MergeRequestTab from "@ext/git/core/GitMergeRequest/components/MergeRequestTab";
import ShowMergeRequest from "@ext/git/core/GitMergeRequest/components/ShowMergeRequest";
import { useMergeRequestStore } from "@ext/git/core/GitMergeRequest/logic/store/MergeRequestStore";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import PublishTab from "@ext/git/core/GitPublish/PublishTab";
import t from "@ext/localization/locale/translate";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import { useEffect, useRef, useState } from "react";
import ConnectStorage from "../../../../../extensions/catalog/actions/ConnectStorage";
import Branch from "../../../../../extensions/git/actions/Branch/components/Branch";
import Sync from "../../../../../extensions/git/actions/Sync/components/Sync";
import StatusBar from "../../StatusBar";

export enum LeftNavigationTab {
	None,

	MergeRequest,
	Publish,
	Branch,
	Revisions,

	Inbox,
	Template,
	Snippets,
	Prompt,
	FavoriteArticles,
}

const Wrapper = styled.div`
	max-height: min-content;

	::-webkit-scrollbar {
		display: none;
	}
	-ms-overflow-style: none;
	scrollbar-width: none;
`;

const ArticleStatusBar = ({ padding }: { padding?: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext } = usePlatform();
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	const [branch, setBranch] = useState<GitBranchData>(null);
	const [branchError, setBranchError] = useState<DefaultError>(null);
	const { mergeRequestIsDraft, mergeRequest, setMergeRequestIsDraft, setMergeRequest } = useMergeRequestStore(
		(state) => ({
			mergeRequestIsDraft: state.isDraft,
			mergeRequest: state.mergeRequest,
			setMergeRequestIsDraft: state.setIsDraft,
			setMergeRequest: state.setMergeRequest,
		}),
	);
	const mergeRequestRef = useRef<MergeRequest>(null);
	const { catalogName, repositoryError, resolvedFilterPropertyValue } = useCatalogPropsStore(
		(state) => ({
			catalogName: state.data.name,
			repositoryError: state.data.repositoryError,
			resolvedFilterPropertyValue: state.data.resolvedFilterPropertyValue,
		}),
		"shallow",
	);

	const isStorageConnected = useIsStorageConnected();
	const isRepoError = !!repositoryError;

	const { bottomTab } = NavigationTabsService.value;

	useWatch(() => {
		mergeRequestRef.current = mergeRequest;
	}, [mergeRequest]);

	const setupMergeRequestState = async (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
		if (isNext) return;

		const response = await FetchService.fetch<MergeRequest | undefined>(apiUrlCreator.getDraftMergeRequest());
		const data = response.ok ? await response.json() : null;
		const mr = data || branch?.mergeRequest;

		setMergeRequestIsDraft(!!data && !branch?.mergeRequest);
		setMergeRequest(mr ?? null);

		const mergeRequestWasBefore = !!mergeRequestRef.current;

		if (
			mr &&
			caller !== OnBranchUpdateCaller.DiscardNoReset &&
			caller !== OnBranchUpdateCaller.Publish &&
			!mergeRequestWasBefore
		)
			NavigationTabsService.setBottom(LeftNavigationTab.MergeRequest);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: fixed in future
	useEffect(() => {
		const onUpdateBranch = (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
			setupMergeRequestState(branch, caller);
			if (caller === OnBranchUpdateCaller.MergeRequest) return;

			setBranch(branch);
			if (!isNext && caller === OnBranchUpdateCaller.Checkout) refreshPage();
		};

		const onError = (error: DefaultError) => setBranchError(error);

		BranchUpdaterService.addListener(onUpdateBranch);
		if (!isRepoError) BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Init);
		BranchUpdaterService.addOnErrorListener(onError);

		return () => {
			BranchUpdaterService.removeListener(onUpdateBranch);
			BranchUpdaterService.removeOnErrorListener(onError);
		};
	}, [isStorageConnected, isRepoError, isNext, catalogName]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		NavigationTabsService.setBottom(LeftNavigationTab.None);
	}, [catalogName]);

	const bar = () => {
		if (!isStorageConnected) return [<ConnectStorage key={0} />];

		if (isRepoError) {
			return [
				<RepositoryBroken
					error={repositoryError}
					key={0}
					trigger={
						<StatusBarElement
							iconCode="cloud-alert"
							iconStyle={{ fontSize: "15px", fill: "white" }}
							tooltipText={t("git.error.broken.tooltip")}
						/>
					}
				/>,
			];
		}

		return [
			<Sync key={0} style={{ height: "100%" }} />,
			!isNext && isReadOnly && <ProtectedBranch key={1} />,
			<IsReadOnlyHOC key={2}>
				<ShowPublishBar
					isShow={bottomTab === LeftNavigationTab.Publish}
					onClick={() => {
						NavigationTabsService.setBottom(
							bottomTab === LeftNavigationTab.Publish
								? LeftNavigationTab.None
								: LeftNavigationTab.Publish,
						);
					}}
				/>
			</IsReadOnlyHOC>,
		];
	};

	return (
		// key to force re-render when catalog changes (for desktop)
		<Wrapper key={catalogName}>
			<MergeRequestTab
				isDraft={mergeRequestIsDraft}
				mergeRequest={mergeRequest}
				setShow={(show) =>
					NavigationTabsService.setBottom(show ? LeftNavigationTab.MergeRequest : LeftNavigationTab.None)
				}
				show={bottomTab === LeftNavigationTab.MergeRequest}
			/>
			<BranchTab
				branch={branch}
				onClose={() => NavigationTabsService.setBottom(LeftNavigationTab.None)}
				onMergeRequestCreate={() => setupMergeRequestState(branch, OnBranchUpdateCaller.MergeRequest)}
				setShow={(show) =>
					NavigationTabsService.setBottom(show ? LeftNavigationTab.Branch : LeftNavigationTab.None)
				}
				show={bottomTab === LeftNavigationTab.Branch}
			/>
			<RevisionsTab
				setShow={(show) =>
					NavigationTabsService.setBottom(show ? LeftNavigationTab.Revisions : LeftNavigationTab.None)
				}
				show={bottomTab === LeftNavigationTab.Revisions}
			/>
			<PublishTab
				setShow={(show) =>
					NavigationTabsService.setBottom(show ? LeftNavigationTab.Publish : LeftNavigationTab.None)
				}
				show={bottomTab === LeftNavigationTab.Publish}
			/>
			<StatusBar
				leftElements={
					!isRepoError && isStorageConnected && !branchError && !resolvedFilterPropertyValue
						? [
								<Branch
									branch={branch}
									key={LeftNavigationTab.Branch}
									onClick={() => {
										const tab =
											bottomTab === LeftNavigationTab.Branch
												? LeftNavigationTab.None
												: LeftNavigationTab.Branch;

										NavigationTabsService.setBottom(tab);
									}}
									show={bottomTab === LeftNavigationTab.Branch}
								/>,
								<ShowMergeRequest
									isShow={bottomTab === LeftNavigationTab.MergeRequest}
									key={LeftNavigationTab.MergeRequest}
									mergeRequest={mergeRequest}
									setShow={() => {
										const tab =
											bottomTab === LeftNavigationTab.MergeRequest
												? LeftNavigationTab.None
												: LeftNavigationTab.MergeRequest;

										NavigationTabsService.setBottom(tab);
									}}
								/>,
								<ShowRevisionsTab
									isShow={bottomTab === LeftNavigationTab.Revisions}
									key={LeftNavigationTab.Revisions}
									setShow={() => {
										const tab =
											bottomTab === LeftNavigationTab.Revisions
												? LeftNavigationTab.None
												: LeftNavigationTab.Revisions;

										NavigationTabsService.setBottom(tab);
									}}
								/>,
							]
						: []
				}
				padding={padding}
				rightElements={bar()}
			/>
		</Wrapper>
	);
};

export default ArticleStatusBar;
