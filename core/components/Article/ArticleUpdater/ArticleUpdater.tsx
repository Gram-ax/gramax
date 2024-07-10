import { classNames } from "@components/libs/classNames";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import { useCallback, useEffect, useState } from "react";
import ArticleUpdaterService from "./ArticleUpdaterService";

export interface ArticleUpdaterProps {
	data: ArticlePageData;
	onUpdate: (data: ArticlePageData) => void;
	children: JSX.Element;
	className?: string;
}

const ArticleUpdater = (props: ArticleUpdaterProps) => {
	const { data, onUpdate, children, className } = props;
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

	return <div className={classNames(className, { isLoading })}>{children}</div>;
};

export default styled(ArticleUpdater)`
	height: 100%;
	display: flex;
	flex-direction: column;

	&.isLoading {
		opacity: 0.6;
		pointer-events: none;
	}
`;
