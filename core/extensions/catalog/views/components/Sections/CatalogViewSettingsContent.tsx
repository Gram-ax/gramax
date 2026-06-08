import styled from "@emotion/styled";
import { CatalogViewSettingsContext } from "@ext/catalog/views/components/Context/CatalogViewSettingsContext";
import { CatalogViewSection } from "@ext/catalog/views/components/Helpers/CatalogViewSection";
import { CatalogViewFooter } from "@ext/catalog/views/components/Sections/CatalogViewFooter";
import { CatalogViewSavedSection } from "@ext/catalog/views/components/Sections/CatalogViewSavedSection";
import { EditCatalogView } from "@ext/catalog/views/components/Sections/EditCatalogView/EditCatalogView";
import { useCatalogViewSettings } from "@ext/catalog/views/logic/hooks/useCatalogViewSettings";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Form } from "@ui-kit/Form";
import { Label } from "@ui-kit/Label";
import { PopoverContent } from "@ui-kit/Popover";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { type RefObject, useMemo } from "react";

interface CatalogViewSettingsContentProps {
	items: CatalogView[];
	isLoading: boolean;
	hasMoreRef: RefObject<boolean>;
	hasViews?: boolean;
	editable?: boolean;
	onLoadMore: () => void;
	onSaveClick?: (view: CatalogView) => void;
	onUpdateClick?: (view: CatalogView) => void;
	onUpdateDocportalVisible?: (view: CatalogView, checked: boolean) => void;
	onDeleteClick?: (view: CatalogView) => void;
}

const ScrollContainer = styled(ScrollShadowContainer)`
	max-height: min(75dvh, var(--radix-popover-content-available-height));
`;

export const CatalogViewSettingsContent = (props: CatalogViewSettingsContentProps) => {
	const {
		items,
		isLoading,
		hasMoreRef,
		hasViews,
		editable = true,
		onLoadMore,
		onSaveClick,
		onUpdateClick,
		onUpdateDocportalVisible,
		onDeleteClick,
	} = props;

	const { form, state, editingId, isEditingOrSaving, onChange, onEditClick, onStartSaving, onSubmit, onCancel } =
		useCatalogViewSettings({ items, onSaveClick, onUpdateClick });

	const filters = form.watch("filters");
	const properties = form.watch("properties");

	const showFooter = useMemo(() => {
		return (!isEditingOrSaving && (filters.length > 0 || properties.length > 0)) || isEditingOrSaving;
	}, [isEditingOrSaving, filters.length, properties.length]);

	return (
		<CatalogViewSettingsContext.Provider
			value={{
				form,
				state,
				items,
				isLoading,
				hasMoreRef,
				hasViews,
				editable,
				editingId,
				isEditingOrSaving,
				onLoadMore,
				onEditClick,
				onUpdateDocportalVisible,
				onDeleteClick,
				onStartSaving,
				onSubmit,
				onCancel,
				onChange,
			}}
		>
			<PopoverContent align="start" className="p-0 w-60" onOpenAutoFocus={(e) => e.preventDefault()}>
				{state === "editing" && (
					<>
						<CatalogViewSection className="flex items-center gap-2" style={{ paddingBottom: "0.75rem" }}>
							<Label>{t("catalog.views.editing")}</Label>
						</CatalogViewSection>
						<Divider />
					</>
				)}
				<Form asChild {...form}>
					<form className="contents ui-kit" onSubmit={onSubmit}>
						<ScrollContainer>
							<CatalogViewSavedSection editable={editable} />
							{editable && (
								<EditCatalogView disabled={state === "saving"} form={form} onChange={onChange} />
							)}
							{showFooter && (
								<>
									<Divider />
									<CatalogViewSection className="flex items-center gap-2 pb-3 mb-2">
										{!isEditingOrSaving && (filters.length > 0 || properties.length > 0) && (
											<Button
												className="w-full"
												onClick={onStartSaving}
												size="xs"
												type="button"
												variant="primary"
											>
												{t("save")}
											</Button>
										)}
										{isEditingOrSaving && <CatalogViewFooter onCancel={onCancel} />}
									</CatalogViewSection>
								</>
							)}
						</ScrollContainer>
					</form>
				</Form>
			</PopoverContent>
		</CatalogViewSettingsContext.Provider>
	);
};
