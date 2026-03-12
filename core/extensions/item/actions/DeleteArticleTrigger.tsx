import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import { useRouter } from "../../../logic/Api/useRouter";
import FetchService from "../../../ui-logic/ApiServices/FetchService";
import { useCatalogPropsStore } from "../../../ui-logic/stores/CatalogPropsStore/CatalogPropsStore.provider";
import ErrorConfirmService from "../../errorHandlers/client/ErrorConfirmService";
import { shouldShowActionWarning } from "../../localization/actions/OtherLanguagesPresentWarning";
import NavigationEvents from "../../navigation/NavigationEvents";
import type { ItemLink } from "../../navigation/NavigationLinks";
import DeleteItem from "./DeleteItem";

export const DeleteItemTrigger = ({ itemLink, isCategory }: { itemLink: ItemLink; isCategory: boolean }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { supportedLanguagesLength } = useCatalogPropsStore((state) => ({
		catalogName: state.data?.name,
		supportedLanguagesLength: state.data?.supportedLanguages?.length,
	}));
	const router = useRouter();

	const onClickHandler = async () => {
		const deleteConfirmText = t(isCategory ? "confirm-category-delete" : "confirm-article-delete");
		if (!shouldShowActionWarning(supportedLanguagesLength) && !(await confirm(deleteConfirmText))) return;

		ErrorConfirmService.stop();
		const res = await FetchService.fetch(apiUrlCreator.removeItem(itemLink.ref.path));
		if (!res.ok) return;
		const redirectPath = await res.text();
		ErrorConfirmService.start();

		const mutable = { preventGoto: false };
		await NavigationEvents.emit("item-delete", { path: itemLink.pathname, mutable });
		if (mutable.preventGoto) return;

		await refreshPage();
		router.pushPath(redirectPath);
	};

	return <DeleteItem onConfirm={onClickHandler} />;
};
