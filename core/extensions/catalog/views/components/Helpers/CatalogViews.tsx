import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useCatalogViewSettingsContext } from "@ext/catalog/views/components/Context/CatalogViewSettingsContext";
import { CatalogViewSectionEmpty } from "@ext/catalog/views/components/Helpers/CatalogViewSectionEmpty";
import { useApplyView } from "@ext/catalog/views/logic/hooks/useApplyView";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { MenuItem, MenuItemIconButton } from "@ui-kit/MenuItem";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import type { HTMLAttributes } from "react";

interface CatalogViewItemProps extends HTMLAttributes<HTMLDivElement> {
	view: CatalogView;
	editable: boolean;
	disabled?: boolean;
	onEditClick?: (view: CatalogView) => void;
	onItemClick: (viewId: string) => void;
	onUpdateDocportalVisible?: (view: CatalogView, checked: boolean) => void;
	onDeleteClick?: (view: CatalogView) => void;
}

const CatalogViewItem = (props: CatalogViewItemProps) => {
	const { view, editable, onEditClick, onItemClick, onUpdateDocportalVisible, onDeleteClick, ...rest } = props;

	return (
		<MenuItem
			className="[&>span:first-child]:shrink-0 py-1 -ml-2 w-[calc(100%+1rem)] pr-1 aria-selected:bg-secondary-bg-hover"
			data-testid="catalog-view-item"
			onClick={() => onItemClick(view.id)}
			{...rest}
		>
			<TextOverflowTooltip className="min-w-0 flex-1 truncate">{view.name}</TextOverflowTooltip>
			{editable && (
				<>
					<div className="flex items-center gap-1 ml-auto">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<div className="shrink-0">
									<MenuItemIconButton
										className="ml-auto"
										data-testid="catalog-view-item-menu-trigger"
										icon="ellipsis-vertical"
									/>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onEditClick?.(view);
									}}
								>
									<Icon icon="pencil" />
									{t("edit2")}
								</DropdownMenuItem>
								<DropdownMenuCheckboxItem
									checked={view.options?.docportalVisible}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onUpdateDocportalVisible?.(view, !view.options?.docportalVisible);
									}}
								>
									{t("catalog.views.edit.form.options.docportalVisible.name")}
								</DropdownMenuCheckboxItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onDeleteClick?.(view);
									}}
									type="danger"
								>
									<Icon icon="trash" />
									{t("delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</>
			)}
		</MenuItem>
	);
};

export const CatalogViews = () => {
	const {
		items,
		isLoading,
		editable,
		editingId,
		isEditingOrSaving,
		onEditClick,
		onUpdateDocportalVisible,
		onDeleteClick,
	} = useCatalogViewSettingsContext();
	const resolvedViewId = useCatalogPropsStore((state) => state.data?.resolvedView?.id);

	const onItemClick = useApplyView();

	if (isLoading) return null;
	if (!items.length && !resolvedViewId) return <CatalogViewSectionEmpty />;

	return items
		.filter((view) => !view.options?.temp)
		.map((view) => {
			if (isEditingOrSaving && editingId === view.id) return null;

			return (
				<CatalogViewItem
					aria-disabled={isEditingOrSaving && editingId !== view.id}
					aria-selected={view.id === resolvedViewId}
					disabled={isEditingOrSaving && editingId !== view.id}
					editable={editable}
					key={view.id}
					onDeleteClick={onDeleteClick}
					onEditClick={onEditClick}
					onItemClick={onItemClick}
					onUpdateDocportalVisible={onUpdateDocportalVisible}
					view={view}
				/>
			);
		});
};
