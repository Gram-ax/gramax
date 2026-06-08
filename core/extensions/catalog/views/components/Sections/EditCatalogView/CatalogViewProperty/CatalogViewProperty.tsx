import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import styled from "@emotion/styled";
import { CatalogViewField } from "@ext/catalog/views/components/Helpers/CatalogViewField";
import { CatalogViewFieldLabel } from "@ext/catalog/views/components/Helpers/CatalogViewFieldLabel";
import { CatalogViewSection } from "@ext/catalog/views/components/Helpers/CatalogViewSection";
import { CatalogViewSectionEmpty } from "@ext/catalog/views/components/Helpers/CatalogViewSectionEmpty";
import { CatalogViewSectionHeader } from "@ext/catalog/views/components/Helpers/CatalogViewSectionHeader";
import { AddProperty } from "@ext/catalog/views/components/Sections/AddProperty";
import { ViewVariableInputComponent } from "@ext/catalog/views/components/Sections/EditCatalogView/CatalogViewProperty/ViewVariableInputComponent";
import type { EditCatalogViewSchema } from "@ext/catalog/views/logic/schema/getEditCatalogViewSchema";
import t from "@ext/localization/locale/translate";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import type { PropertyValue } from "@ext/properties/models";
import { Label } from "@ui-kit/Label";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { useCallback, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

interface CatalogViewPropertyProps {
	form: UseFormReturn<EditCatalogViewSchema>;
	disabled?: boolean;
	onChange: (properties: PropertyValue[]) => void;
}

const StyledScrollShadowContainer = styled(ScrollShadowContainer)`
	max-height: min(35vh, 20rem);
	overflow-x: hidden;
`;

export const CatalogViewProperty = ({ form, disabled, onChange }: CatalogViewPropertyProps) => {
	const { properties: catalogProperties } = PropertyServiceProvider.value;

	const formProperties = form.watch("properties") as PropertyValue[];

	const properties = useMemo(() => {
		return formProperties.map((property) => ({ ...catalogProperties.get(property.id), value: property.value }));
	}, [formProperties, catalogProperties]);

	const onAddProperty = useCallback(
		(properties: PropertyValue[]) => {
			form.setValue("properties", properties);
			onChange(properties);
		},
		[form, onChange],
	);

	const onChangeProperty = useCallback(
		(id: string, value: string[]) => {
			const newProperties = [...formProperties];
			const index = newProperties.findIndex((property) => property.id === id);

			if (index !== -1) newProperties[index] = { id, value };
			else newProperties.push({ id, value });

			onAddProperty(newProperties);
		},
		[formProperties, onAddProperty],
	);

	const onDeleteProperty = useCallback(
		(id: string) => {
			const newProperties = [...formProperties];
			const index = newProperties.findIndex((property) => property.id === id);
			if (index !== -1) newProperties.splice(index, 1);
			onAddProperty(newProperties);
		},
		[formProperties, onAddProperty],
	);

	return (
		<>
			<CatalogViewSection>
				<CatalogViewSectionHeader>
					<Label>{t("catalog.views.sections.properties")}</Label>
					<AddProperty disabled={disabled} onChange={onAddProperty} properties={properties} />
				</CatalogViewSectionHeader>
				<StyledScrollShadowContainer className="space-y-5 lg:space-y-4">
					<div style={{ paddingBottom: "0.25rem" }}>
						{properties?.map((property) => {
							const originalProperty = catalogProperties.get(property.id);
							if (!originalProperty) return null;

							return (
								<CatalogViewField
									control={() => (
										<div className="flex flex-row items-center gap-1 flex-wrap">
											<ViewVariableInputComponent
												onChange={(value) => onChangeProperty(property.id, value)}
												type={originalProperty.type}
												value={property.value}
												values={originalProperty.values}
											/>
										</div>
									)}
									key={property.id}
									name={`properties.${property.id}`}
									title={
										<CatalogViewFieldLabel>
											{originalProperty.name}
											<TooltipIconButton
												className="shrink-0 p-0 h-auto"
												icon="x"
												onClick={() => onDeleteProperty(property.id)}
												size="sm"
												tooltip={t("delete")}
												type="button"
												variant="text"
											/>
										</CatalogViewFieldLabel>
									}
								/>
							);
						})}
						{!properties?.length && <CatalogViewSectionEmpty />}
					</div>
				</StyledScrollShadowContainer>
			</CatalogViewSection>
		</>
	);
};
