import { cn } from "@core-ui/utils/cn";
import { useCatalogViewSettingsContext } from "@ext/catalog/views/components/Context/CatalogViewSettingsContext";
import { CatalogViewInput } from "@ext/catalog/views/components/Helpers/CatalogViewInput";
import { CatalogViewSection } from "@ext/catalog/views/components/Helpers/CatalogViewSection";
import { CatalogViewSectionEmpty } from "@ext/catalog/views/components/Helpers/CatalogViewSectionEmpty";
import { CatalogViewSectionHeader } from "@ext/catalog/views/components/Helpers/CatalogViewSectionHeader";
import { CatalogViews } from "@ext/catalog/views/components/Helpers/CatalogViews";
import t from "@ext/localization/locale/translate";
import { Divider } from "@ui-kit/Divider";
import { ErrorState } from "@ui-kit/ErrorState";
import { Label } from "@ui-kit/Label";
import { LoadMoreTrigger } from "@ui-kit/LoadMoreTrigger";
import { Controller } from "react-hook-form";

export const CatalogViewSavedSection = ({ editable }: { editable: boolean }) => {
	const { form, hasViews, hasMoreRef, isEditingOrSaving, onLoadMore } = useCatalogViewSettingsContext();

	return (
		<>
			<CatalogViewSection>
				<CatalogViewSectionHeader>
					<Label>{t("catalog.views.sections.saved")}</Label>
				</CatalogViewSectionHeader>
				{isEditingOrSaving && (
					<Controller
						control={form.control}
						name="name"
						render={({ field, fieldState }) => (
							<>
								<CatalogViewInput {...field} />
								{fieldState.error && (
									<ErrorState className="text-xs">{t("catalog.views.name-required")}</ErrorState>
								)}
							</>
						)}
					/>
				)}
				{hasViews || isEditingOrSaving ? (
					<>
						<CatalogViews />
						<LoadMoreTrigger hasMore={hasMoreRef.current} onLoad={onLoadMore ?? (() => {})} />
					</>
				) : (
					<CatalogViewSectionEmpty className={cn(!editable && "pb-3", editable && "pb-1")} />
				)}
			</CatalogViewSection>
			{editable && <Divider />}
		</>
	);
};
