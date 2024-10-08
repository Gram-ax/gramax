import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { useRouter } from "@core/Api/useRouter";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import ActionWarning, { shouldShowActionWarning } from "@ext/localization/actions/ActionWarning";
import t from "@ext/localization/locale/translate";
import Path from "../../../logic/FileProvider/Path/Path";

export type DeleteItemProps = {
	isCategory: boolean;
	itemPath: string;
	itemLink: string;
};

const DeleteItem = (props: DeleteItemProps) => {
	const { isCategory, itemPath, itemLink } = props;
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;
	const deleteConfirmText = t(isCategory ? "confirm-category-delete" : "confirm-article-delete");

	const onClickHandler = async () => {
		if (!shouldShowActionWarning(catalogProps) && !(await confirm(deleteConfirmText))) return;
		ErrorConfirmService.stop();
		await FetchService.fetch(apiUrlCreator.removeItem(itemPath));
		ErrorConfirmService.start();
		const itemLinkPath = new Path(itemLink);
		if (new Path(router.path).removeExtraSymbols.compare(itemLinkPath))
			router.pushPath(itemLinkPath.parentDirectoryPath.value);
		else refreshPage();
	};

	return (
		<ActionWarning isDelete catalogProps={catalogProps} action={onClickHandler}>
			<ButtonLink iconCode="trash" text={`${t("delete")}`} />
		</ActionWarning>
	);
};

export default DeleteItem;
