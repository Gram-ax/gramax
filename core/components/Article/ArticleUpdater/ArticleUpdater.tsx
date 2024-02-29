import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { useCallback, useEffect, useState } from "react";
import ArticleUpdaterService from "./ArticleUpdaterService";

const ArticleUpdater = ({
	data,
	onUpdate,
	children,
}: {
	data: ArticlePageData;
	onUpdate: (data: ArticlePageData) => void;
	children: JSX.Element;
}) => {
	const isEdit = IsEditService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	if (isReadOnly) return children;

	const [isLoading, setIsLoading] = useState(false);
	const updateContent = useCallback(() => {
		ArticleUpdaterService.update(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!isEdit && !isReadOnly) updateContent();
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
		window.addEventListener("focus", updateContent);
		return () => window.removeEventListener("focus", updateContent);
	}, [updateContent]);

	return <div style={isLoading ? { opacity: 0.6, pointerEvents: "none" } : null}>{children}</div>;
};

export default ArticleUpdater;
