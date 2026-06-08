import type { CatalogViewState } from "@ext/catalog/views/logic/hooks/useCatalogViewSettings";
import type { EditCatalogViewSchema } from "@ext/catalog/views/logic/schema/getEditCatalogViewSchema";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import type { PropertyValue } from "@ext/properties/models";
import { createContext, type RefObject, useContext } from "react";
import type { UseFormReturn } from "react-hook-form";

export interface CatalogViewSettingsContextValue {
	form: UseFormReturn<EditCatalogViewSchema>;
	state: CatalogViewState;
	items: CatalogView[];
	isLoading: boolean;
	hasMoreRef: RefObject<boolean>;
	hasViews: boolean | null;
	editable: boolean;
	editingId: string;
	isEditingOrSaving: boolean;
	onLoadMore?: () => void;
	onEditClick?: (view: CatalogView) => void;
	onUpdateDocportalVisible?: (view: CatalogView, checked: boolean) => void;
	onDeleteClick?: (view: CatalogView) => void;
	onStartSaving?: () => void;
	onSubmit?: (e: React.FormEvent) => void;
	onCancel?: () => void;
	onChange?: (filters: PropertyValue[], properties: PropertyValue[]) => void;
}

export const CatalogViewSettingsContext = createContext<CatalogViewSettingsContextValue | null>(null);

export const useCatalogViewSettingsContext = () => {
	const ctx = useContext(CatalogViewSettingsContext);
	if (!ctx) throw new Error("useCatalogViewSettingsContext must be used within CatalogViewSettingsContext");
	return ctx;
};
