import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import DiffContent from "@components/Atoms/DiffContent";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import Publish from "@ext/git/actions/Publish/components/Publish";
import PublishLeftNavContentWrapper from "@ext/git/actions/Publish/components/PublishLeftNavContentWrapper";
import PublishModal from "@ext/git/actions/Publish/components/PublishModal";
import t from "@ext/localization/locale/translate";
import { Change } from "@ext/VersionControl/DiffHandler/model/Change";
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

	const resetPublishView = () => {
		if (!isDevMode) return;
		LeftNavViewContentService.setDefaultView();
		ArticleViewService.setDefaultView();
		setIsPublishView(false);
	};

	const setArticleView = (changes: Change[]) => {
		ArticleViewService.setView(() => <DiffContent showDiff={true} changes={changes} />, false);
	};

	useEffect(() => {
		return () => resetPublishView();
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
					resetPublishView();
					await ArticleUpdaterService.update(apiUrlCreator);
					refreshPage();

					if (!hasDiscard.current) return;
					hasDiscard.current = false;
					router.pushPath(rootPath);
				} else {
					LeftNavViewContentService.setView(() => (
						<PublishLeftNavContentWrapper>
							<Publish
								onEndDiscard={(_, hasDeleted) => {
									hasDiscard.current = hasDeleted;
								}}
								renderLeftSidebarOnly
								onOpenIdChange={(_, sideBarElement) => {
									setArticleView(sideBarElement?.diff?.changes ?? []);
								}}
								onSideBarDataLoadError={resetPublishView}
								goToArticleOnClick={(e) => {
									e.stopPropagation();
									resetPublishView();
								}}
							/>
						</PublishLeftNavContentWrapper>
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
