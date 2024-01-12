import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import { useRouter } from "../../../logic/Api/useRouter";
import Path from "../../../logic/FileProvider/Path/Path";
import useLocalize from "../../localization/useLocalize";

const DeleteItem = ({
	isCategory,
	itemPath,
	itemLink,
}: {
	isCategory: boolean;
	itemPath: string;
	itemLink: string;
}) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const deleteConfirmText = useLocalize(isCategory ? "confirmCategoryDelete" : "confirmArticleDelete");

	return (
		<div
			data-qa="qa-clickable"
			onClick={async () => {
				if (!(await confirm(deleteConfirmText))) return;
				ErrorConfirmService.stop();
				await FetchService.fetch(apiUrlCreator.removeItem(itemPath));
				ErrorConfirmService.start();
				const itemLinkPath = new Path(itemLink);
				if (new Path(router.path).removeExtraSymbols.compare(itemLinkPath))
					router.pushPath(itemLinkPath.parentDirectoryPath.value);
				else refreshPage();
			}}
		>
			<Icon code="trash" faFw />
			<span>{`${useLocalize("delete")} ${useLocalize(isCategory ? "category" : "article")}`}</span>
		</div>
	);
};

export default DeleteItem;
