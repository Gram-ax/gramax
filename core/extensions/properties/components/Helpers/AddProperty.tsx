import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import t from "@ext/localization/locale/translate";
import PropertyItem from "@ext/properties/components/Helpers/PropertyItem";
import type { PropertyEditorProps } from "@ext/properties/components/Modals/PropertyEditor";
import combineProperties from "@ext/properties/logic/combineProperties";
import type { Property, PropertyValue } from "@ext/properties/models";
import { DropdownMenuItem, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef } from "react";

interface AddPropertyProps {
	properties: Property[] | PropertyValue[];
	catalogProperties: Map<string, Property>;
	setProperties?: Dispatch<SetStateAction<Property[]>>;
	canAdd?: boolean;
	canEdit?: boolean;
	disabled?: boolean;
	onSubmit: (propertyName: string, value: string) => void;
}

const AddProperty = (props: AddPropertyProps) => {
	const { canAdd = false, canEdit = true, properties, catalogProperties, onSubmit, setProperties, disabled } = props;
	const articleProps = ArticlePropsService.value;
	const setArticleProps = ArticlePropsService.setArticleProps;
	const catalogProps = useCatalogPropsStore((state) => state);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const isOpenRef = useRef(false);

	useEffect(() => {
		if (!isOpenRef.current) return;
		ModalToOpenService.resetValue();
		isOpenRef.current = false;
	}, [articleProps.logicPath]);

	const saveCatalogProperties = useCallback(
		async (property: Property, isDelete: boolean = false, saveValue?: boolean) => {
			const newProps = getCatalogEditProps(catalogProps.data);
			const index = newProps.properties.findIndex((obj) => obj.name === property.name);

			if (index === -1) newProps.properties = [...newProps.properties, property];
			else {
				if (isDelete) {
					newProps.properties = newProps.properties.filter((_, propIndex) => propIndex !== index);
					const res = saveValue
						? null
						: await FetchService.fetch(apiUrlCreator.removePropertyFromArticles(property.name));

					if (res?.ok && canAdd) {
						const props = await res.json();
						setProperties(combineProperties(props, catalogProperties));
					}
				} else {
					const deletedValues = saveValue
						? ""
						: newProps.properties?.[index]?.values
								?.filter((value) => !property.values.includes(value))
								.toString();

					newProps.properties = [...newProps.properties];
					newProps.properties[index] = {
						...property,
					};

					if (deletedValues) {
						const res = saveValue
							? null
							: await FetchService.fetch(
									apiUrlCreator.removePropertyFromArticles(property.name, deletedValues),
								);

						if (res?.ok && canAdd) {
							const props = await res.json();
							setProperties(combineProperties(props, catalogProperties));
						}
					}
				}
			}

			FetchService.fetch(apiUrlCreator.updateCatalogProps(), JSON.stringify(newProps), MimeTypes.json);
			catalogProps.update({ properties: newProps.properties });
			setArticleProps({ ...articleProps, properties: combineProperties(properties, catalogProperties) });
		},
		[catalogProps.data, properties, setArticleProps, articleProps],
	);

	const editProperty = useCallback(
		(id?: string) => {
			if (typeof id === "undefined") {
				isOpenRef.current = false;
				ModalToOpenService.resetValue();
				return;
			}

			isOpenRef.current = true;
			ModalToOpenService.setValue<PropertyEditorProps>(ModalToOpen.PropertySettings, {
				properties,
				onlyArticlePropertyTypes: true,
				data: catalogProperties.get(id),
				onSubmit: async (property) => {
					await saveCatalogProperties(property);
					ModalToOpenService.resetValue();
				},
				onDelete: async (isArchive: boolean) => {
					await saveCatalogProperties(catalogProperties.get(id), true, isArchive);
					ModalToOpenService.resetValue();
				},
				onClose: () => {
					isOpenRef.current = false;
					ModalToOpenService.resetValue();
				},
			});
		},
		[catalogProperties, saveCatalogProperties],
	);

	const addProperty = useCallback(
		(id: string, value?: string) => {
			onSubmit(id, value);
		},
		[onSubmit],
	);

	const items = useMemo(() => {
		return Array.from(catalogProperties.values()).map((property) => {
			return (
				<PropertyItem
					disabled={disabled}
					key={property.name}
					onClick={addProperty}
					onEditClick={canEdit ? editProperty : undefined}
					property={property}
				/>
			);
		});
	}, [catalogProperties, disabled]);

	return (
		<>
			{items}
			{items.length > 0 && canAdd && <DropdownMenuSeparator />}
			{canAdd && (
				<DropdownMenuItem onSelect={() => editProperty(null)}>
					<Icon code="plus" />
					{t("properties.add")}
				</DropdownMenuItem>
			)}
		</>
	);
};

export default AddProperty;
