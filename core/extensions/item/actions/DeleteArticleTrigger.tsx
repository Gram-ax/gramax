import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { confirmItemDelete } from "@ext/item/logic/confirmItemDelete";
import { getItemLinkChildrenRecursively } from "@ext/item/logic/getItemLinkChildrenRecursively";
import { useRouter } from "../../../logic/Api/useRouter";
import FetchService from "../../../ui-logic/ApiServices/FetchService";
import { useCatalogPropsStore } from "../../../ui-logic/stores/CatalogPropsStore/CatalogPropsStore.provider";
import ErrorConfirmService from "../../errorHandlers/client/ErrorConfirmService";
import { shouldShowActionWarning } from "../../localization/actions/OtherLanguagesPresentWarning";
import NavigationEvents from "../../navigation/NavigationEvents";
import type { CategoryLink, ItemLink } from "../../navigation/NavigationLinks";
import DeleteItem from "./DeleteItem";

export const DeleteItemTrigger = ({ itemLink }: { itemLink: ItemLink }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { supportedLanguagesLength } = useCatalogPropsStore((state) => ({
		catalogName: state.data?.name,
		supportedLanguagesLength: state.data?.supportedLanguages?.length,
	}));
	const router = useRouter();

	const onClickHandler = async () => {
		if (
			!shouldShowActionWarning(supportedLanguagesLength) &&
			!(await confirmItemDelete(itemLink.title, getItemLinkChildrenRecursively(itemLink as CategoryLink).length))
		)
			return;

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
