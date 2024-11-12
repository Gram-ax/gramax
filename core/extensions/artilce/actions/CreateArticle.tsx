import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { useRouter } from "@core/Api/useRouter";
import type { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import ActionWarning from "@ext/localization/actions/ActionWarning";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { MouseEventHandler, useState } from "react";

const MAX_CATALOG_DEPTH = 9;

interface CreateArticleProps {
	item?: ItemLink;
	root?: ClientItemRef;
	className?: string;
	onCreate?: () => void;
}

export const isDeepestArticle = (path: string) =>
	path && path.replace(`/${CATEGORY_ROOT_FILENAME}`, "").split("/").length > MAX_CATALOG_DEPTH;

const CreateArticle = (props: CreateArticleProps) => {
	const { item, root, className, onCreate } = props;

	const catalogProps = CatalogPropsService.value;

	if (isDeepestArticle(item?.ref?.path)) return null;

	const [isLoading, setIsLoading] = useState(false);
	const content = item ? t("article.add-child") : t("article.add-root");
	const router = useRouter();

	const isEdit = IsEditService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const url = apiUrlCreator.createArticle(item ? item.ref.path : root?.path);

	const onClickHandler: MouseEventHandler<HTMLElement> = (e) => {
		e?.stopPropagation();
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
		<ActionWarning catalogProps={catalogProps} action={onClickHandler}>
			<span className={className}>
				<ButtonLink
					iconFw={false}
					iconCode="plus"
					iconViewBox="3 3 18 18"
					iconIsLoading={isLoading}
					textSize={item ? null : TextSize.M}
					iconContent={content}
					iconPlace={item ? "top" : "right"}
				/>
			</span>
		</ActionWarning>
	);
};

export default styled(CreateArticle)`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;
