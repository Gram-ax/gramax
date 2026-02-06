import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { useRouter } from "@core/Api/useRouter";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useDeleteCatalog, useDeleteCloudCatalog } from "@ext/catalog/actions/propsEditor/components/useDeleteCatalog";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";

export const DeleteCatalog = ({ children }: { children: ReactNode }) => {
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
		<CatalogItem
			renderLabel={(Item) => {
				const props = {
					onSelect: async () => (await confirm(deleteText)) && deleteCatalog(),
					type: "danger",
				};

				return (
					<Item {...props}>
						<Icon code="trash" />
						{t("catalog.delete.name")}
					</Item>
				);
			}}
		>
			{children}
		</CatalogItem>
	);
};

export default DeleteCatalog;
