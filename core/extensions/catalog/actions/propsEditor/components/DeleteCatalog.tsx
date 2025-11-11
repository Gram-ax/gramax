import Icon from "@components/Atoms/Icon";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import { useDeleteCatalog, useDeleteCloudCatalog } from "@ext/catalog/actions/propsEditor/components/useDeleteCatalog";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

export const DeleteCatalog = () => {
	const router = useRouter();
	const { name, sourceName } = useCatalogPropsStore(
		(state) => ({ name: state.data?.name, sourceName: state.data?.sourceName }),
		"shallow",
	);
	const deleteCatalog = usePlatform().isStatic
		? useDeleteCloudCatalog({})
		: useDeleteCatalog({ name, onDeleted: () => router.pushPath("/") });

	const deleteText = sourceName ? t("catalog.delete.storage") : t("catalog.delete.local");

	return (
		<DropdownMenuItem onSelect={async () => (await confirm(deleteText)) && deleteCatalog()} type="danger">
			<Icon code="trash" />
			{t("catalog.delete.name")}
		</DropdownMenuItem>
	);
};

export default DeleteCatalog;
