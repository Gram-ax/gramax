import DiffContent from "@components/Atoms/DiffContent";
import Divider from "@components/Atoms/Divider";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavView from "@components/Layouts/LeftNavViewContent/LeftNavView";
import LeftNavViewContent, { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import useWatch from "@core-ui/hooks/useWatch";
import { Trigger } from "@core-ui/triggers/useTrigger";
import useWatchTrigger from "@core-ui/triggers/useWatchTrigger";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import CommitMsg from "@ext/git/actions/Publish/components/CommitMsg";
import SelectAllCheckbox from "@ext/git/actions/Publish/components/SelectAllCheckbox";
import SideBarResource from "@ext/git/actions/Publish/components/SideBarResource";
import findArticleIdx from "@ext/git/actions/Publish/logic/findArticleIdx";
import formatComment from "@ext/git/actions/Publish/logic/formatComment";
import getSideBarData from "@ext/git/actions/Publish/logic/getSideBarData";
import getSideBarElementByModelIdx, {
	SideBarElementData,
} from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import deleteSideBarDataItem from "../logic/deleteSideBarDataItems";
import getAllFilePaths from "../logic/getAllFilePaths";
import SideBarData from "../model/SideBarData";
import SideBarArticleActions from "./SideBarArticleActions";
interface PublishProps {
	renderLeftSidebarOnly?: boolean;
	onSideBarDataLoadStart?: () => void;
	onSideBarDataLoadEnd?: () => void;
	onSideBarDataLoadError?: () => void;
	onStartPublish?: () => void;
	onStopPublish?: () => void;
	onErrorPublish?: () => void;
	onStartDiscard?: (paths: string[]) => void;
	onEndDiscard?: (paths: string[], hasDeleted: boolean) => void;
	onSideBarDataChange?: (newSideBarData: SideBarData[]) => void;
	goToArticleOnClick?: (e: MouseEvent) => void;
	onOpenIdChange?: (data: SideBarElementData, sideBarData: SideBarData[]) => void;
	tryPublishTrigger?: Trigger;
	className?: string;
}

const Publish = (props: PublishProps) => {
	const {
		renderLeftSidebarOnly = false,
		onSideBarDataLoadStart,
		onSideBarDataLoadEnd,
		onSideBarDataLoadError,
		onStartPublish,
		onStopPublish,
		onErrorPublish,
		onStartDiscard,
		onEndDiscard,
		onSideBarDataChange,
		goToArticleOnClick,
		onOpenIdChange,
		tryPublishTrigger,
		className,
	} = props;

	const [sideBarData, setSideBarData] = useState<SideBarData[]>(null);
	const [commitMessage, setCommitMessage] = useState<string>(undefined);
	const [openId, setOpenId] = useState(0);

	const [publishProcess, setPublishProcess] = useState(false);
	const [discardProcess, setDiscardProcess] = useState(false);

	const fileCountToShow = useMemo(() => getAllFilePaths(sideBarData, false).length, [sideBarData]);
	const filePaths = useMemo(() => getAllFilePaths(sideBarData), [sideBarData]);

	const commitMessagePlaceholder = useMemo(() => formatComment(sideBarData), [sideBarData]);
	const placeholder = commitMessagePlaceholder.split("\n\n")[0];

	const [checkAll, setCheckAll] = useState(true);

	const inputRef = useRef<HTMLInputElement>(null);
	const hasFocused = useRef(false);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;

	const canPublish = !publishProcess && fileCountToShow && commitMessage != "";

	const setOpenIdWrapper = (idx: number, sideBarData: SideBarData[]) => {
		const data = getSideBarElementByModelIdx(idx, sideBarData);
		setOpenId(data.idx);
		onOpenIdChange?.(data, sideBarData);
	};

	const setSideBarDataWrapper = (newSideBarData: SideBarData[]) => {
		setSideBarData(newSideBarData);
		onSideBarDataChange?.(newSideBarData);
	};

	const onStartDiscardWrapper = (paths: string[]) => {
		setDiscardProcess(true);
		onStartDiscard?.(paths);
	};
	const onEndDiscardWrapper = (paths: string[], hasDeleted: boolean) => {
		setDiscardProcess(false);
		onEndDiscard?.(paths, hasDeleted);
	};

	const publish = async () => {
		const publishUrl = apiUrlCreator.getStoragePublishUrl(
			commitMessage?.length > 0 ? commitMessage : commitMessagePlaceholder,
		);
		setPublishProcess(true);
		onStartPublish?.();
		const response = await FetchService.fetch(publishUrl, JSON.stringify(filePaths), MimeTypes.json);
		setPublishProcess(false);
		if (!response.ok) return onErrorPublish?.();
		onStopPublish?.();
	};

	useWatch(() => {
		if (!sideBarData) return;

		setCheckAll(
			sideBarData
				.filter((x) => x)
				.map((x) => x.data.isChecked)
				.every((x) => x),
		);

		if (sideBarData.length && (!sideBarData[0] || !sideBarData[sideBarData.length - 1]))
			setSideBarDataWrapper(sideBarData.filter((x) => x));
	}, [sideBarData]);

	useWatchTrigger(() => {
		if (canPublish) void publish();
	}, tryPublishTrigger);

	useEffect(() => {
		if (!sideBarData || hasFocused.current) return;
		inputRef.current?.focus();
		hasFocused.current = true;
	}, [sideBarData]);

	useEffect(() => {
		const getDiffItemsData = async () => {
			onSideBarDataLoadStart?.();
			const response = await FetchService.fetch<{ items: DiffItem[]; resources: DiffResource[] }>(
				apiUrlCreator.getVersionControlDiffItemsUrl(),
			);

			if (!response.ok) return onSideBarDataLoadError?.();

			const diffItemsData = await response.json();
			onSideBarDataLoadEnd?.();
			const itemDiffs = getSideBarData(diffItemsData?.items ?? [], true, false);
			const anyFileDiffs = getSideBarData(diffItemsData?.resources ?? [], true, true);
			const currentSideBarData: SideBarData[] = [];

			if (itemDiffs.length && anyFileDiffs.length) {
				currentSideBarData.push(...[...itemDiffs, null, ...anyFileDiffs]);
			} else {
				if (itemDiffs.length) currentSideBarData.push(...itemDiffs);
				if (anyFileDiffs.length) currentSideBarData.push(...anyFileDiffs);
			}

			const currentLogicPaths = itemDiffs.flatMap((sideBarItem) => [
				sideBarItem.data.logicPath,
				...sideBarItem.data.resources.map(() => null),
			]);
			setSideBarDataWrapper(currentSideBarData);
			setOpenIdWrapper(findArticleIdx(articleProps.pathname, currentLogicPaths), currentSideBarData);
		};
		void getDiffItemsData();
	}, []);

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	if (!sideBarData) return spinnerLoader;

	const sideBarTop = (
		<SelectAllCheckbox
			className="sidebar-top-element"
			checked={checkAll}
			onCheckboxClick={(isChecked) => {
				const newSideBarData = [...sideBarData];
				newSideBarData.forEach((item) => {
					if (!item) return;
					item.data.isChecked = isChecked;
				});
				setSideBarDataWrapper(newSideBarData);
			}}
			onCheckboxChange={(isChecked) => setCheckAll(isChecked)}
			showDiscardAllButton={fileCountToShow > 0}
			filePathsToDiscard={filePaths}
			onStartDiscard={(paths) => onStartDiscardWrapper(paths)}
			onEndDiscard={(paths) => {
				onEndDiscardWrapper(paths, true);
				if (!paths.length) return;
				const filteredSideBarData = sideBarData.filter((d) =>
					!d ? true : !paths.includes(d.data.filePath.path),
				);
				setSideBarDataWrapper(filteredSideBarData);
				setOpenIdWrapper(openId, filteredSideBarData);
			}}
		/>
	);

	const sideBarBottom = (
		<CommitMsg
			className="sidebar-bottom-element"
			commitMessagePlaceholder={placeholder}
			commitMessageValue={commitMessage ?? placeholder}
			disableCommitInput={!!publishProcess}
			disablePublishButton={!canPublish}
			fileCount={fileCountToShow}
			onCommitMessageChange={(msg) => setCommitMessage(msg)}
			onPublishClick={publish}
		/>
	);

	const emptyElement: ViewContent[] = [{ leftSidebar: <div></div>, clickable: false, content: <div></div> }];

	const sideBarDataElements: ViewContent[] = sideBarData.flatMap((x, idx) => {
		if (!x) {
			return {
				leftSidebar: (
					<div className="left-sidebar-divider">
						<Divider />
					</div>
				),
				clickable: false,
			};
		}
		const item: ViewContent = {
			leftSidebar: (
				<SideBarArticleActions
					{...x.data}
					checked={x.data.isChecked}
					addedCounter={x.diff?.added}
					removedCounter={x.diff?.removed}
					onChangeCheckbox={(isChecked) => {
						const newSideBarData = [...sideBarData];
						newSideBarData[idx].data.isChecked = isChecked;
						setSideBarDataWrapper(newSideBarData);
					}}
					onStartDiscard={(paths) => onStartDiscardWrapper(paths)}
					onEndDiscard={(paths) => {
						const { sideBarData: editedSideBarData, hasDeleted } = deleteSideBarDataItem(
							sideBarData,
							paths,
						);
						onEndDiscardWrapper(paths, hasDeleted);
						setSideBarDataWrapper(editedSideBarData);
						setOpenIdWrapper(idx, editedSideBarData);
					}}
					goToArticleOnClick={goToArticleOnClick}
				/>
			),
			content: (
				<div className={className}>
					<div className="diff-content">
						<DiffContent showDiff={true} changes={x.diff?.changes ?? []} />
					</div>
				</div>
			),
		};

		return x.data.resources
			? [
					item,
					...x.data.resources.map((resource, id) => {
						const parentPath = resource.parentPath;
						const resourceApi = apiUrlCreator.fromArticle(parentPath);
						const relativeTo = new Path(parentPath);
						return {
							leftSidebar: (
								<div style={{ padding: "1rem 1rem 1rem 0" }}>
									<SideBarResource changeType={x.data.changeType} title={resource.data.title} />
								</div>
							),
							content: (
								<>
									{useResourceView(
										id,
										resourceApi,
										new Path(resource.data.filePath.path),
										resource.data.changeType === FileStatus.delete,
										x.diff,
										relativeTo,
									)}
								</>
							),
						};
					}),
			  ]
			: item;
	});

	const elements = sideBarData.length ? sideBarDataElements : emptyElement;

	return (
		<>
			<ModalLayout isOpen={publishProcess || discardProcess}>{spinnerLoader}</ModalLayout>
			<div className={className}>
				{renderLeftSidebarOnly ? (
					<LeftNavView
						elements={elements}
						sideBarTop={sideBarTop}
						sideBarBottom={sideBarBottom}
						currentIdx={openId}
						onLeftSidebarClick={(idx) => {
							setOpenIdWrapper(idx, sideBarData);
						}}
					/>
				) : (
					<LeftNavViewContent
						elements={elements}
						sideBarTop={sideBarTop}
						sideBarBottom={sideBarBottom}
						currentIdx={openId}
						onLeftSidebarClick={(idx) => {
							setOpenIdWrapper(idx, sideBarData);
						}}
					/>
				)}
			</div>
		</>
	);
};

export default styled(Publish)`
	height: 100%;

	.diff-content {
		padding: 20px;
	}

	.sidebar-top-element,
	.sidebar-bottom-element {
		background: var(--color-menu-bg);
		padding: 1rem;
	}

	.left-sidebar-divider {
		padding: 1rem;
	}
`;
