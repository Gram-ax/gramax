import generateUniqueID from "@core/utils/generateUniqueID";
import { useDeferApi } from "@core-ui/hooks/useApi";
import {
	type EditCatalogViewSchema,
	getEditCatalogViewSchema,
} from "@ext/catalog/views/logic/schema/getEditCatalogViewSchema";
import createViewModel from "@ext/catalog/views/logic/utils/createViewModel";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import { CATALOG_TEMP_VIEW_ID } from "@ext/catalog/views/models/consts";
import t from "@ext/localization/locale/translate";
import type { PropertyValue } from "@ext/properties/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { type FormEvent, useCallback, useState } from "react";
import { useForm } from "react-hook-form";

export type CatalogViewState = "idle" | "editing" | "saving";

interface UseCatalogViewSettingsProps {
	items: CatalogView[];
	onSaveClick: (view: CatalogView) => void;
	onUpdateClick: (view: CatalogView) => void;
}

export const useCatalogViewSettings = ({ items, onSaveClick, onUpdateClick }: UseCatalogViewSettingsProps) => {
	const [state, setState] = useState<CatalogViewState>("idle");
	const [editingId, setEditingId] = useState<string>(null);

	const form = useForm<EditCatalogViewSchema>({
		resolver: zodResolver(getEditCatalogViewSchema()),
		defaultValues: { name: "", filters: [], properties: [] },
	});

	const { call: applyTempView } = useDeferApi({
		onDone: () => {
			refreshPage();
		},
	});

	const applyTempViewHandler = useCallback(
		(name: string, filters: PropertyValue[], properties: PropertyValue[]) => {
			const body =
				filters.length > 0 || properties.length > 0
					? createViewModel({
							id: CATALOG_TEMP_VIEW_ID,
							name,
							filters,
							properties,
							options: { temp: true },
						})
					: null;

			applyTempView({ url: (api) => api.applyTempCatalogView(), opts: { body } });
		},
		[applyTempView],
	);

	const exitFromViewHandler = useCallback(() => {
		applyTempView({
			url: (api) => api.applyTempCatalogView(),
			opts: { body: null },
		});
	}, [applyTempView]);

	const reset = useCallback(() => {
		form.reset({ name: "", filters: [], properties: [], options: {} });
		exitFromViewHandler();
		setEditingId(null);
		setState("idle");
	}, [form, exitFromViewHandler]);

	const onChange = useCallback(
		(filters: PropertyValue[], properties: PropertyValue[]) => {
			form.setValue("filters", filters);
			form.setValue("properties", properties);
			const name = form.getValues("name") || t("catalog.views.temp-view");
			applyTempViewHandler(name, filters, properties);
		},
		[form, applyTempViewHandler],
	);

	const onEditClick = useCallback(
		(view: CatalogView) => {
			setState("editing");
			setEditingId(view.id);
			form.reset({
				name: view.name,
				filters: view.filters,
				properties: view.properties,
				options: view.options ?? {},
			});
			applyTempViewHandler(view.name, view.filters, view.properties);
		},
		[form, applyTempViewHandler],
	);

	const onStartSaving = useCallback(() => {
		setState("saving");
	}, []);

	const onSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();
			form.handleSubmit(async (data) => {
				if (state === "saving") {
					onSaveClick({
						id: generateUniqueID(),
						name: data.name,
						filters: data.filters,
						properties: data.properties,
						options: data.options,
					} as CatalogView);
				} else if (state === "editing") {
					const editingView = items.find((v) => v.id === editingId);
					if (editingView)
						onUpdateClick({
							...editingView,
							name: data.name,
							filters: data.filters,
							properties: data.properties,
							options: data.options,
						} as CatalogView);
				}
				reset();
			})(e);
		},
		[form, state, editingId, items, onSaveClick, onUpdateClick, reset],
	);

	return {
		form,
		state,
		editingId,
		isEditingOrSaving: state === "editing" || state === "saving",
		onChange,
		onEditClick,
		onStartSaving,
		onSubmit,
		onCancel: reset,
	};
};
