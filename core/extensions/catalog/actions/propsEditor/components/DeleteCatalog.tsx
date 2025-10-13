import Icon from "@components/Atoms/Icon";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import { useDeleteCatalog, useDeleteCloudCatalog } from "@ext/catalog/actions/propsEditor/components/useDeleteCatalog";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";

export const DeleteCatalog = () => {
	const router = useRouter();
	const catalogProps = CatalogPropsService.value;
	const deleteCatalog = usePlatform().isStatic
		? useDeleteCloudCatalog({})
		: useDeleteCatalog({ name: catalogProps.name, onDeleted: () => router.pushPath("/") });

	const deleteText = catalogProps.sourceName ? t("catalog.delete.storage") : t("catalog.delete.local");

	return (
		<DropdownMenuItem onSelect={async () => (await confirm(deleteText)) && deleteCatalog()} type="danger">
			<Icon code="trash" />
			{t("catalog.delete.name")}
		</DropdownMenuItem>
	);
};

export default DeleteCatalog;
