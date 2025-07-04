import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import { useRouter } from "@core/Api/useRouter";
import type { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
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

	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const url = apiUrlCreator.createArticle(item ? item.ref.path : root?.path);

	const onClickHandler: MouseEventHandler<HTMLElement> = (e) => {
		e?.stopPropagation();
		FetchService.fetch(url).then(async (response) => {
			setIsLoading(false);
			if (!response.ok) return refreshPage();
			onCreate?.();
			await NavigationEvents.emit("item-create", { path: await response.text() });
			router.pushPath(await response.text());
		});
		setIsLoading(true);
	};

	if (isReadOnly) return null;

	return (
		<OtherLanguagesPresentWarning catalogProps={catalogProps} action={onClickHandler}>
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
		</OtherLanguagesPresentWarning>
	);
};

export default styled(CreateArticle)`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;
