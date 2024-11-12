import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import DiffContent from "@components/Atoms/DiffContent";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import useTrigger from "@core-ui/triggers/useTrigger";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import Publish from "@ext/git/actions/Publish/components/Publish";
import PublishLeftNavContentWrapper from "@ext/git/actions/Publish/components/PublishLeftNavContentWrapper";
import PublishModal from "@ext/git/actions/Publish/components/PublishModal";
import { SideBarElementData } from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import t from "@ext/localization/locale/translate";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";

const ArticlePublishTrigger = ({ changesCount }: { changesCount?: number }) => {
	const [isDevMode] = useState(() => getIsDevMode());
	const [isPublishView, setIsPublishView] = useState(false);

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
		LeftNavViewContentService.setDefaultView();
		ArticleViewService.setDefaultView();
		setIsPublishView(false);
		await ArticleUpdaterService.update(apiUrlCreator);
		refreshPage();
	};

	const setArticleView = (data: SideBarElementData) => {
		if (data.sideBarDataElement?.isResource) {
			const parentPath = data.sideBarDataElement.parentPath;
			if (!parentPath)
				return ArticleViewService.setView(() => <DiffContent showDiff={true} changes={[]} />, false);

			const resourceApi = apiUrlCreator.fromArticle(parentPath);
			const relativeTo = new Path(parentPath);
			ArticleViewService.setView(
				() => (
					<>
						{useResourceView(
							data.relativeIdx ?? data.idx,
							resourceApi,
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
			ArticleViewService.setView(
				() => <DiffContent showDiff={true} changes={data.sideBarDataElement?.diff?.changes ?? []} />,
				false,
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
					});

				if (isPublishView) {
					await resetPublishView();
					if (!hasDiscard.current) return;
					hasDiscard.current = false;
					router.pushPath(rootPath);
				} else {
					LeftNavViewContentService.setView(() => (
						<PublishViewComponent
							onEscape={resetPublishView}
							renderLeftSidebarOnly
							onEndDiscard={(_, hasDeleted) => {
								hasDiscard.current = hasDeleted;
							}}
							onStopPublish={async () => {
								await resetPublishView();
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
							goToArticleOnClick={(e) => {
								e.stopPropagation();
								resetPublishView();
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
			{changesCount && <span>{changesCount}</span>}
		</StatusBarElement>
	);
};

export default ArticlePublishTrigger;

type PublishViewComponentProps = React.ComponentProps<typeof Publish> & {
	onEscape?: () => void;
};

const PublishViewComponent = ({  onEscape, ...props }: PublishViewComponentProps) => {
	const [cmdEnterTriggerValue, cmdEnterTrigger] = useTrigger();

	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onEscape?.();
			else if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
				console.log("cmdEnterTrigger");
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
