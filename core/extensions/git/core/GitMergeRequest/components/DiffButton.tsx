import Button from "@components/Atoms/Button/Button";
import Divider from "@components/Atoms/Divider";
import LeftNavView from "@components/Layouts/LeftNavViewContent/LeftNavView";
import { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import Sidebar from "@components/Layouts/Sidebar";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import useSidebarsStates from "@core-ui/useSidebarsStates";
import Path from "@core/FileProvider/Path/Path";
import SidebarArticleLink from "@ext/git/actions/Publish/components/SidebarArticleLink";
import getSideBarData from "@ext/git/actions/Publish/logic/getSideBarData";
import getSideBarElementByModelIdx, {
	SideBarElementData,
} from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import t from "@ext/localization/locale/translate";
import ArticleDiffModeView from "@ext/markdown/elements/diff/components/ArticleDiffModeView";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { ComponentProps, useState } from "react";

interface DiffButtonProps {
	sourceBranch: string;
	targetBranch: string;
}

const getSideBarDataFromDiffItems = (diffItems: DiffItem[], diffResources: DiffResource[]) => {
	const itemDiffs = getSideBarData(diffItems ?? [], true, false);
	const anyFileDiffs = getSideBarData(diffResources ?? [], true, true);
	const currentSideBarData: SideBarData[] = [];

	if (itemDiffs.length && anyFileDiffs.length) {
		currentSideBarData.push(...[...itemDiffs, null, ...anyFileDiffs]);
	} else {
		if (itemDiffs.length) currentSideBarData.push(...itemDiffs);
		if (anyFileDiffs.length) currentSideBarData.push(...anyFileDiffs);
	}
	return currentSideBarData;
};

const getViewContent = (sideBarData: SideBarData[]): ViewContent[] => {
	return sideBarData.flatMap((x) => {
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
				<div style={{ padding: "1rem" }}>
					<Sidebar title={x.data.title} />
					<SidebarArticleLink filePath={x.data.filePath} type={x.data.changeType} />
				</div>
			),
			content: null,
		};

		return item;
	});
};

const DiffButton = ({ sourceBranch, targetBranch }: DiffButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [isDiffView, setIsDiffView] = useState(false);
	const { saveStates: saveSidebarsStates, loadStates: loadSidebarsStates } = useSidebarsStates();

	const setArticleView = (data: SideBarElementData) => {
		if (data.sideBarDataElement?.isResource) {
			const parentPath = data.sideBarDataElement.parentPath;

			const resourceApiUrlCreator = apiUrlCreator.fromArticle(parentPath);
			const relativeTo = new Path(parentPath);

			ArticleViewService.setView(
				() => (
					<>
						{useResourceView(
							data.relativeIdx ?? data.idx,
							resourceApiUrlCreator,
							new Path(data.sideBarDataElement.data.filePath.path),
							data.sideBarDataElement.data.changeType === FileStatus.delete,
							data.sideBarDataElement.diff,
							relativeTo,
						)}
					</>
				),
				false,
			);
		} else {
			const sideBarData = data.sideBarDataElement as SideBarData;
			ArticleViewService.setView(() => (
				<ArticleDiffModeView
					key={sideBarData.data.filePath.path}
					oldEditTree={sideBarData.data.oldEditTree}
					newEditTree={sideBarData.data.newEditTree}
					oldContent={sideBarData.data.oldContent}
					newContent={sideBarData.data.content}
					changeType={sideBarData.data.changeType}
					articlePath={sideBarData.data.filePath.path}
					onWysiwygUpdate={({ editor }) => (sideBarData.data.newEditTree = editor.getJSON())}
					onViewModeChange={(view) => {
						ArticleViewService.useArticleDefaultStyles = view === "wysiwyg";
					}}
					readOnly
				/>
			));
		}
	};

	const setDiffView = async () => {
		ModalToOpenService.setValue(ModalToOpen.Loading);
		const res = await FetchService.fetch<{ items: DiffItem[]; resources: DiffResource[] }>(
			apiUrlCreator.mergeRequestDiffItems(sourceBranch, targetBranch),
		);
		ModalToOpenService.resetValue();

		if (!res.ok) return;
		setIsDiffView(true);
		const diffItemsData = await res.json();
		const sideBarData = getSideBarDataFromDiffItems(diffItemsData.items, diffItemsData.resources);
		const leftViewContent = getViewContent(sideBarData);

		saveSidebarsStates();
		SidebarsIsPinService.isSidebarsDependent = false;
		SidebarsIsPinService.value = { right: false };
		SidebarsIsOpenService.value = { right: false };

		setArticleView(getSideBarElementByModelIdx(0, sideBarData));

		LeftNavViewContentService.setView(() => (
			<LeftNavViewWrapper
				currentIdx={0}
				elements={leftViewContent}
				onLeftSidebarClick={(idx) => {
					setArticleView(getSideBarElementByModelIdx(idx, sideBarData));
				}}
			/>
		));
	};

	const setDefaultView = () => {
		loadSidebarsStates();
		LeftNavViewContentService.setDefaultView();
		ArticleViewService.setDefaultView();
		setIsDiffView(false);
	};

	return (
		<Button
			onClick={async () => {
				if (isDiffView) {
					setDefaultView();
				} else {
					await setDiffView();
				}
			}}
		>
			{isDiffView ? t("git.merge-requests.back") : t("git.merge-requests.changes")}
		</Button>
	);
};

const LeftNavViewWrapper = (props: ComponentProps<typeof LeftNavView>) => {
	const [idx, setIdx] = useState(0);
	return (
		<LeftNavView
			{...props}
			currentIdx={idx}
			onLeftSidebarClick={(idx) => {
				setIdx(idx);
				props.onLeftSidebarClick?.(idx);
			}}
		/>
	);
};

export default DiffButton;
