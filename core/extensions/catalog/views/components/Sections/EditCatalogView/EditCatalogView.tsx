import { CatalogViewFilter } from "@ext/catalog/views/components/Sections/EditCatalogView/CatalogViewFilter/CatalogViewFilter";
import { CatalogViewProperty } from "@ext/catalog/views/components/Sections/EditCatalogView/CatalogViewProperty/CatalogViewProperty";
import type { EditCatalogViewSchema } from "@ext/catalog/views/logic/schema/getEditCatalogViewSchema";
import type { PropertyValue } from "@ext/properties/models";
import { memo, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

export interface EditCatalogViewProps {
	form: UseFormReturn<EditCatalogViewSchema>;
	disabled?: boolean;
	onChange: (filters: PropertyValue[], properties: PropertyValue[]) => void;
}

export const EditCatalogView = memo(({ form, disabled, onChange }: EditCatalogViewProps) => {
	const onFiltersChange = useCallback(
		(filters: PropertyValue[]) => {
			onChange(filters, form.getValues("properties") as PropertyValue[]);
		},
		[form, onChange],
	);

	const onPropertiesChange = useCallback(
		(properties: PropertyValue[]) => {
			onChange(form.getValues("filters") as PropertyValue[], properties);
		},
		[form, onChange],
	);

	return (
		<>
			<CatalogViewFilter disabled={disabled} form={form} onChange={onFiltersChange} />
			<CatalogViewProperty disabled={disabled} form={form} onChange={onPropertiesChange} />
		</>
	);
});
