import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import DiffContent from "@components/Atoms/DiffContent";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import useWatch from "@core-ui/hooks/useWatch";
import useTrigger from "@core-ui/triggers/useTrigger";
import useSidebarsStates from "@core-ui/useSidebarsStates";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import Publish from "@ext/git/actions/Publish/components/Publish";
import PublishLeftNavContentWrapper from "@ext/git/actions/Publish/components/PublishLeftNavContentWrapper";
import PublishModal from "@ext/git/actions/Publish/components/PublishModal";
import { SideBarElementData } from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import ArticleDiffModeView from "@ext/markdown/elements/diff/components/ArticleDiffModeView";
import ArticlePropsesCache from "@ext/markdown/elements/diff/logic/ArticlePropsesCache";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";

type ArticlePublishTriggerProps = {
	onPublish?: () => void;
	onDiscard?: () => void;
};

const ArticlePublishTrigger = ({ onPublish, onDiscard }: ArticlePublishTriggerProps) => {
	const overview = GitIndexService.getOverview();
	const totalChanged = overview.added + overview.deleted + overview.modified;

	const [isDevMode] = useState(() => getIsDevMode());
	const [isPublishView, setIsPublishView] = useState(false);

	const { saveStates: saveSidebarsStates, loadStates: loadSidebarsStates } = useSidebarsStates();

	const diffViewMode = DiffViewModeService.value;
	const useDefaultStylesRef = useRef(diffViewMode === "wysiwyg");

	useWatch(() => {
		useDefaultStylesRef.current = diffViewMode === "wysiwyg";
	}, [diffViewMode]);

	const hasDiscard = useRef(false);
	const router = useRouter();

	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const rootPath = useMemo(() => {
		const pathnameData = RouterPathProvider.parsePath(catalogProps.link.pathname);
		return RouterPathProvider.getPathname({
			...pathnameData,
			filePath: null,
			itemLogicPath: null,
		}).value;
	}, [catalogProps.link.pathname]);

	const resetPublishView = async () => {
		if (!isDevMode) return;
		loadSidebarsStates();
		LeftNavViewContentService.setDefaultView();
		ArticleViewService.setDefaultView();
		setIsPublishView(false);
		ArticlePropsesCache.clear();
		await ArticleUpdaterService.update(apiUrlCreator);
		refreshPage();
	};

	const setEmptyView = () => {
		ArticleViewService.setView(() => <DiffContent showDiff changes={[]} />, false);
	};

	const setArticleView = (data: SideBarElementData) => {
		if (data.sideBarDataElement?.isResource) {
			const parentPath = data.sideBarDataElement.parentPath;

			const resourceApiUrlCreator = apiUrlCreator.fromArticle(parentPath.path);
			const relativeTo = new Path(parentPath.path);

			const resourceView = useResourceView({
				id: data.relativeIdx ?? data.idx,
				apiUrlCreator: resourceApiUrlCreator,
				resourcePath: new Path(data.sideBarDataElement.data.filePath.path),
				oldContent: data.sideBarDataElement.data.oldContent,
				newContent: data.sideBarDataElement.data.content,
				relativeTo,
				filePath: data.sideBarDataElement.data.filePath,
			});

			ArticleViewService.setView(
				() => (
					<>
						{data.sideBarDataElement.data.status === FileStatus.delete ? (
							<ApiUrlCreatorService.Provider value={resourceApiUrlCreator}>
								<ResourceService.Provider scope="HEAD">{resourceView}</ResourceService.Provider>
							</ApiUrlCreatorService.Provider>
						) : (
							resourceView
						)}
					</>
				),
				false,
			);
		} else {
			if (!data.sideBarDataElement) return setEmptyView();
			const sideBarData = data.sideBarDataElement as SideBarData;
			ArticleViewService.setView(
				() => (
					<>
						<ArticleDiffModeView
							title={sideBarData.data.title}
							oldRevision={"HEAD"}
							newRevision={"workdir"}
							oldScope={"HEAD"}
							filePath={sideBarData.data.filePath}
							key={sideBarData.data.filePath.path}
							oldEditTree={sideBarData.data.oldEditTree}
							newEditTree={sideBarData.data.newEditTree}
							oldContent={sideBarData.data.oldContent}
							newContent={sideBarData.data.content}
							changeType={sideBarData.data.status}
							articlePath={sideBarData.data.filePath.path}
							onWysiwygUpdate={({ editor }) => (sideBarData.data.newEditTree = editor.getJSON())}
							onViewModeChange={(view) => {
								ArticleViewService.useArticleDefaultStyles = view === "wysiwyg";
							}}
						/>
					</>
				),
				useDefaultStylesRef.current,
			);
		}
	};

	useEffect(() => {
		return () => void resetPublishView();
	}, []);

	return (
		<StatusBarElement
			onClick={async () => {
				if (!isDevMode)
					return ModalToOpenService.setValue<ComponentProps<typeof PublishModal>>(ModalToOpen.Publish, {
						onClose: async (hasDiscard) => {
							ModalToOpenService.resetValue();
							if (!hasDiscard) return;
							await ArticleUpdaterService.update(apiUrlCreator);
							refreshPage();
							router.pushPath(rootPath);
						},
						onStopPublish: onPublish,
						onEndDiscard: onDiscard,
					});

				if (isPublishView) {
					await resetPublishView();
					if (!hasDiscard.current) return;
					hasDiscard.current = false;
					router.pushPath(rootPath);
				} else {
					saveSidebarsStates();
					SidebarsIsPinService.isSidebarsDependent = false;
					SidebarsIsPinService.value = { right: false };
					SidebarsIsOpenService.value = { right: false };

					LeftNavViewContentService.setView(() => (
						<PublishViewComponent
							onEscape={resetPublishView}
							renderLeftSidebarOnly
							onEndDiscard={(_, hasDeleted) => {
								hasDiscard.current = hasDeleted;
								if (hasDeleted) onDiscard?.();
							}}
							onStopPublish={async () => {
								await resetPublishView();
								onPublish?.();
								if (!hasDiscard.current) return;
								hasDiscard.current = false;
								router.pushPath(rootPath);
							}}
							onOpenIdChange={async (data, sideBarData) => {
								const isEmpty = sideBarData.filter((x) => x).length === 0;
								if (isEmpty && hasDiscard.current) {
									hasDiscard.current = false;
									await resetPublishView();
									router.pushPath(rootPath);
									return;
								}
								setArticleView(data);
							}}
							onSideBarDataLoadError={resetPublishView}
							goToArticleOnClick={async (e) => {
								e.stopPropagation();
								await resetPublishView();
							}}
						/>
					));
					setIsPublishView(true);
				}
			}}
			iconCode="cloud"
			iconStyle={{ fontSize: "15px" }}
			tooltipText={t("publish-changes")}
		>
			{totalChanged > 0 && <span>{totalChanged}</span>}
		</StatusBarElement>
	);
};

export default ArticlePublishTrigger;

type PublishViewComponentProps = React.ComponentProps<typeof Publish> & {
	onEscape?: () => void;
};

const PublishViewComponent = ({ onEscape, ...props }: PublishViewComponentProps) => {
	const [cmdEnterTriggerValue, cmdEnterTrigger] = useTrigger();

	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onEscape?.();
			else if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
				cmdEnterTrigger();
			}
		};
		document.addEventListener("keydown", keydownHandler);
		return () => document.removeEventListener("keydown", keydownHandler);
	}, [cmdEnterTrigger]);

	return (
		<PublishLeftNavContentWrapper>
			<Publish {...props} tryPublishTrigger={cmdEnterTriggerValue} />
		</PublishLeftNavContentWrapper>
	);
};
