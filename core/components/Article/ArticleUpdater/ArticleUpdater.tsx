import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ArticleData } from "@core/SitePresenter/SitePresenter";
import { useCallback, useEffect, useState } from "react";
import getE2E from "../../../../e2e";
import ArticleUpdaterService from "./ArticleUpdaterService";

const ArticleUpdater = ({
	data,
	onUpdate,
	children,
}: {
	data: ArticleData;
	onUpdate: (data: ArticleData) => void;
	children: JSX.Element;
}) => {
	const isEdit = IsEditService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isServerApp = PageDataContextService.value.conf.isServerApp;

	if (isServerApp) return children;

	const [isLoading, setIsLoading] = useState(false);
	const updateContent = useCallback(() => {
		ArticleUpdaterService.update(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!isEdit && !isServerApp) updateContent();
	}, [isEdit]);

	useEffect(() => {
		ArticleUpdaterService.bindData(data);
	}, [data]);

	useEffect(() => {
		ArticleUpdaterService.bindOnUpdate(onUpdate);
		ArticleUpdaterService.startLoadingAfterFocus();
		ArticleUpdaterService.bindSetIsLoading(setIsLoading);
	}, []);

	useEffect(() => {
		getE2E().updateContent = updateContent;
		window.addEventListener("focus", updateContent);
		return () => window.removeEventListener("focus", updateContent);
	}, [updateContent]);

	return <div style={isLoading ? { flex: 1, opacity: 0.6, pointerEvents: "none" } : { flex: 1 }}>{children}</div>;
};

export default ArticleUpdater;
