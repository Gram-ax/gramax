import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { MouseEventHandler, useState } from "react";

interface CreateArticleProps {
	item?: ItemLink;
	className?: string;
	onCreate?: () => void;
}

const isDeepestCatalog = (path: string) => {
	const MAX_DEPTH = 9;

	if (!path) return false;

	return path.replace("/_index.md", "").split("/").length > MAX_DEPTH;
};

const CreateArticle = (props: CreateArticleProps) => {
	const { item, className, onCreate } = props;

	if (isDeepestCatalog(item?.ref?.path)) return null;

	const [isLoading, setIsLoading] = useState(false);
	const content = item ? t("article.add-child") : t("article.add-root");
	const router = useRouter();

	const isEdit = IsEditService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const url = apiUrlCreator.createArticle(item ? item.ref.path : null);

	const onClickHandler: MouseEventHandler<HTMLElement> = (e) => {
		e.stopPropagation();
		FetchService.fetch(url).then(async (response) => {
			setIsLoading(false);
			if (!response.ok) return refreshPage();
			onCreate?.();
			router.pushPath(await response.text());
		});
		setIsLoading(true);
	};

	if (!isEdit) return null;

	return (
		<Tooltip content={content} place={item ? "top" : "right"}>
			<span className={className} onClick={onClickHandler}>
				<Icon code="plus" viewBox="3 3 18 18" isAction isLoading={isLoading} />
			</span>
		</Tooltip>
	);
};

export default styled(CreateArticle)`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;
