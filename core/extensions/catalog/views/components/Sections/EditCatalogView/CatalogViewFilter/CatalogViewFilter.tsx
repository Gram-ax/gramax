import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import styled from "@emotion/styled";
import { CatalogViewField } from "@ext/catalog/views/components/Helpers/CatalogViewField";
import { CatalogViewFieldLabel } from "@ext/catalog/views/components/Helpers/CatalogViewFieldLabel";
import { CatalogViewSection } from "@ext/catalog/views/components/Helpers/CatalogViewSection";
import { CatalogViewSectionDivider } from "@ext/catalog/views/components/Helpers/CatalogViewSectionDivider";
import { CatalogViewSectionEmpty } from "@ext/catalog/views/components/Helpers/CatalogViewSectionEmpty";
import { CatalogViewSectionHeader } from "@ext/catalog/views/components/Helpers/CatalogViewSectionHeader";
import { AddProperty } from "@ext/catalog/views/components/Sections/AddProperty";
import { ViewFilterInputComponent } from "@ext/catalog/views/components/Sections/EditCatalogView/CatalogViewFilter/ViewFilterInputComponent";
import type { EditCatalogViewSchema } from "@ext/catalog/views/logic/schema/getEditCatalogViewSchema";
import t from "@ext/localization/locale/translate";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import type { PropertyValue } from "@ext/properties/models";
import { Label } from "@ui-kit/Label";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

interface CatalogViewFilterProps {
	form: UseFormReturn<EditCatalogViewSchema>;
	disabled?: boolean;
	onChange: (filters: PropertyValue[]) => void;
}

const StyledScrollShadowContainer = styled(ScrollShadowContainer)`
	max-height: min(35vh, 20rem);
	overflow-x: hidden;
`;

export const CatalogViewFilter = ({ form, disabled, onChange }: CatalogViewFilterProps) => {
	const filters = form.watch("filters") as PropertyValue[];
	const { properties: catalogProperties } = PropertyServiceProvider.value;

	const onAddFilter = useCallback(
		(properties: PropertyValue[]) => {
			form.setValue("filters", properties);
			onChange(properties);
		},
		[form, onChange],
	);

	const onChangeFilter = useCallback(
		(id: string, value: string[]) => {
			const newFilters = [...filters];
			const index = newFilters.findIndex((filter) => filter.id === id);

			if (index !== -1) newFilters[index] = { id, value };
			else newFilters.push({ id, value });

			onAddFilter(newFilters);
		},
		[filters, onAddFilter],
	);

	const onDeleteFilter = useCallback(
		(id: string) => {
			const newFilters = [...filters];
			const index = newFilters.findIndex((filter) => filter.id === id);
			if (index !== -1) newFilters.splice(index, 1);
			onAddFilter(newFilters);
		},
		[filters, onAddFilter],
	);

	return (
		<>
			<CatalogViewSection>
				<CatalogViewSectionHeader>
					<Label>{t("catalog.views.sections.filters")}</Label>
					<AddProperty disabled={disabled} onChange={onAddFilter} properties={filters} />
				</CatalogViewSectionHeader>
				<StyledScrollShadowContainer className="space-y-5 lg:space-y-4">
					<div style={{ paddingBottom: "0.25rem" }}>
						{filters?.map((filter) => {
							const originalProperty = catalogProperties.get(filter.id);
							if (!originalProperty) return null;

							return (
								<CatalogViewField
									control={() => (
										<div className="flex flex-row items-center gap-1 flex-wrap">
											<ViewFilterInputComponent
												onChange={(value) => onChangeFilter(filter.id, value)}
												type={originalProperty.type}
												value={filter.value}
												values={originalProperty.values}
											/>
										</div>
									)}
									key={filter.id}
									name={`filters.${filter.id}`}
									title={
										<CatalogViewFieldLabel>
											{originalProperty.name}
											<TooltipIconButton
												className="shrink-0 p-0 h-auto"
												icon="x"
												onClick={() => onDeleteFilter(filter.id)}
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
						{!filters?.length && <CatalogViewSectionEmpty />}
					</div>
				</StyledScrollShadowContainer>
			</CatalogViewSection>
			<CatalogViewSectionDivider />
		</>
	);
};
