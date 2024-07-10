import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import { useRouter } from "@core/Api/useRouter";
import Path from "../../../logic/FileProvider/Path/Path";
import useLocalize from "../../localization/useLocalize";

const DeleteItem = (props: { isCategory: boolean; itemPath: string; itemLink: string }) => {
	const { isCategory, itemPath, itemLink } = props;
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const deleteConfirmText = useLocalize(isCategory ? "confirmCategoryDelete" : "confirmArticleDelete");

	const onClickHandler = async () => {
		if (!(await confirm(deleteConfirmText))) return;
		ErrorConfirmService.stop();
		await FetchService.fetch(apiUrlCreator.removeItem(itemPath));
		ErrorConfirmService.start();
		const itemLinkPath = new Path(itemLink);
		if (new Path(router.path).removeExtraSymbols.compare(itemLinkPath))
			router.pushPath(itemLinkPath.parentDirectoryPath.value);
		else refreshPage();
	};

	return <ButtonLink onClick={onClickHandler} iconCode="trash" text={`${useLocalize("delete")}`} />;
};

export default DeleteItem;
