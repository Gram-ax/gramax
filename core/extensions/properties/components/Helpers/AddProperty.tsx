import Icon from "@components/Atoms/Icon";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import PropertiesScrollContainer from "@ext/properties/components/Helpers/PropertiesScrollContainer";
import PropertyItem from "@ext/properties/components/Helpers/PropertyItem";
import type { PropertyEditorProps } from "@ext/properties/components/Modals/PropertyEditor";
import { useUpdateCatalogProperty } from "@ext/properties/logic/hooks/useUpdateCatalogProperty";
import type { Property, PropertyValue } from "@ext/properties/models";
import { isComplexProperty } from "@ext/templates/models/properties";
import { DropdownMenuItem, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface AddPropertyProps {
	properties: Property[] | PropertyValue[];
	catalogProperties: Map<string, Property>;
	canAdd?: boolean;
	canEdit?: boolean;
	disabled?: boolean;
	onSubmit: (propertyName: string, value: string) => void;
	onDelete?: (propertyName: string) => void;
}

const AddProperty = (props: AddPropertyProps) => {
	const { canAdd = false, canEdit = true, properties, catalogProperties, onSubmit, onDelete, disabled } = props;
	const articleProps = ArticlePropsService.value;

	const isOpenRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!isOpenRef.current) return;
		ModalToOpenService.resetValue();
		isOpenRef.current = false;
	}, [articleProps.logicPath]);

	const saveCatalogProperties = useUpdateCatalogProperty({ canAdd });

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
		[catalogProperties, saveCatalogProperties, properties],
	);

	const changeProperty = useCallback(
		(id: string, value?: string) => {
			onSubmit(id, value);
		},
		[onSubmit],
	);

	const articlePropertyMap = useMemo(() => {
		const map = new Map<string, string[]>();
		for (const p of properties) {
			map.set(p.id, p.value);
		}
		return map;
	}, [properties]);

	const filteredCatalogProperties = useMemo(() => {
		return Array.from(catalogProperties.values()).filter((property) => !isComplexProperty[property.type]);
	}, [catalogProperties]);

	const items = useMemo(() => {
		return filteredCatalogProperties.map((property) => {
			const hasProperty = articlePropertyMap.has(property.id);
			const articleValue = articlePropertyMap.get(property.id);
			const selected = hasProperty ? (articleValue?.length ? articleValue : true) : false;
			return (
				<PropertyItem
					disabled={disabled}
					key={property.id}
					onClick={changeProperty}
					onDeleteClick={onDelete}
					onEditClick={canEdit ? editProperty : undefined}
					property={{ ...property, value: articleValue }}
					selected={selected}
				/>
			);
		});
	}, [filteredCatalogProperties, disabled, changeProperty, onDelete, canEdit, editProperty, articlePropertyMap]);

	return (
		<>
			<PropertiesScrollContainer>{items}</PropertiesScrollContainer>
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
