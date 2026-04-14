import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useRouter } from "@core/Api/useRouter";
import type { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import styled from "@emotion/styled";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { type MouseEventHandler, useState } from "react";

const MAX_CATALOG_DEPTH = 9;

export const isDeepestArticle = (path: string) =>
	path && path.replace(`/${CATEGORY_ROOT_FILENAME}`, "").split("/").length > MAX_CATALOG_DEPTH;

interface CreateArticleProps {
	item?: ItemLink;
	root?: ClientItemRef;
	className?: string;
	onCreate?: () => void;
}

const StyledSpan = styled.span`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const CreateArticleComponent = (props: CreateArticleProps) => {
	const { item, root, className, onCreate } = props;

	const [isLoading, setIsLoading] = useState(false);
	const content = item ? t("article.add-child") : t("article.add-root");

	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const url = apiUrlCreator.createArticle(item ? item.ref.path : root?.path);

	const onClickHandler: MouseEventHandler<HTMLElement> = (e) => {
		e?.preventDefault();
		e?.stopPropagation();
		FetchService.fetch(url).then(async (response) => {
			setIsLoading(false);
			if (!response.ok) return refreshPage();
			onCreate?.();

			const mutable = { preventGoto: false };
			const path = await response.text();
			await NavigationEvents.emit("item-create", { path, mutable });
			if (mutable.preventGoto) return;

			router.pushPath(path);
		});
		setIsLoading(true);
	};

	return (
		<OtherLanguagesPresentWarning action={onClickHandler}>
			<StyledSpan className={className}>
				<ButtonLink
					iconCode="plus"
					iconContent={content}
					iconFw={false}
					iconIsLoading={isLoading}
					iconPlace={item ? "top" : "right"}
					iconViewBox="3 3 18 18"
					textSize={item ? null : TextSize.M}
				/>
			</StyledSpan>
		</OtherLanguagesPresentWarning>
	);
};

const CreateArticle = (props: CreateArticleProps) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	if (isDeepestArticle(props?.item?.ref?.path) || isReadOnly) return null;

	return <CreateArticleComponent {...props} />;
};

export default CreateArticle;
