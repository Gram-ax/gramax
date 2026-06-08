import type ActionConfirm from "@components/Atoms/ActionConfirm";
import ButtonLink from "@components/Molecules/ButtonLink";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useDeferApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { CatalogViewSettingsContent } from "@ext/catalog/views/components/Sections/CatalogViewSettingsContent";
import type { CatalogView as CatalogViewType } from "@ext/catalog/views/models/CatalogViews";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { Icon } from "@ui-kit/Icon";
import { Popover, PopoverTrigger } from "@ui-kit/Popover";
import { type ComponentProps, memo, useCallback, useRef, useState } from "react";

type CatalogViewsResponse = { views: CatalogViewType[]; hasMore: boolean };

export const CatalogView = memo(() => {
	const [items, setItems] = useState<CatalogViewType[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const { isTauri, isBrowser } = usePlatform();
	const workspace = Workspace.current();
	const { catalogName, isReadOnly, hasViews, updateProps } = useCatalogPropsStore((state) => {
		return {
			catalogName: state?.data?.name,
			isReadOnly: !!state.data.resolvedVersion,
			hasViews: state.data?.hasViews,
			updateProps: state.update,
		};
	});
	const isCatalogExist = !!catalogName;

	const offsetRef = useRef(0);
	const hasMoreRef = useRef(true);
	const openRef = useRef(false);

	const catalogView = useCatalogPropsStore((state) => state.data?.resolvedView);

	const { call: fetchCatalogViews } = useDeferApi<CatalogViewsResponse, CatalogViewsResponse>({
		parse: "json",
		map: (data) => ({ views: data.views ?? [], hasMore: data.hasMore ?? false }),
	});

	const { call: mutateCatalogView } = useDeferApi<unknown>({
		parse: "json",
		opts: { failOnParse: false },
	});

	const handleOpenChange = useCallback((open: boolean) => {
		openRef.current = open;
		if (open) return;

		offsetRef.current = 0;
		hasMoreRef.current = true;
		setIsLoading(true);
		setItems([]);
	}, []);

	const getViews = useCallback(
		async ({ offset = 0, limit = 10 }: { offset: number; limit: number }) => {
			await fetchCatalogViews({
				url: (api) => api.getCatalogViews(offset, limit, null),
				onStart: () => setIsLoading(true),
				onDone: (data) => {
					setItems(data.views);
					hasMoreRef.current = data.hasMore;
					offsetRef.current = offset + limit;
				},
				onFinally: () => setIsLoading(false),
			});
		},
		[fetchCatalogViews],
	);

	const createView = useCallback(
		async (view: CatalogViewType) => {
			await mutateCatalogView({
				url: (api) => api.createCatalogView(),
				opts: { body: view, parse: "json", mime: MimeTypes.json },
				onDone: () => {
					setItems((prev) => [...prev, view].sort((a, b) => a.name.localeCompare(b.name)));
					updateProps({ hasViews: true });
				},
			});
		},
		[mutateCatalogView, updateProps],
	);

	const updateView = useCallback(
		async (view: CatalogViewType) => {
			await mutateCatalogView({
				url: (api) => api.updateCatalogView(),
				opts: { body: view, parse: "json", mime: MimeTypes.json },
				onDone: () =>
					setItems((prev) =>
						prev.map((v) => (v.id === view.id ? view : v)).sort((a, b) => a.name.localeCompare(b.name)),
					),
			});
		},
		[mutateCatalogView],
	);

	const onUpdateDocportalVisible = useCallback(
		async (view: CatalogViewType, docportalVisible: boolean) => {
			await updateView({ ...view, options: { ...view.options, docportalVisible } });
		},
		[updateView],
	);

	const deleteView = useCallback(
		async (viewId: string) => {
			await mutateCatalogView({
				url: (api) => api.deleteCatalogView(viewId),
				onDone: () => {
					setItems((prev) => {
						const next = prev.filter((v) => v.id !== viewId);
						if (next.length === 0) updateProps({ hasViews: false });
						return next;
					});
				},
			});
		},
		[mutateCatalogView, updateProps],
	);

	const onLoadMore = useCallback(() => {
		getViews({ offset: offsetRef.current, limit: 10 });
	}, [getViews]);

	const onDeleteClick = useCallback(
		(view: CatalogViewType) => {
			ModalToOpenService.setValue<ComponentProps<typeof ActionConfirm>>(ModalToOpen.ActionConfirm, {
				confirmTitle: t("confirmation.delete.title"),
				confirmBody: t("catalog.views.edit.deleteDescription"),
				initialIsOpen: true,
				onConfirm: () => deleteView(view.id),
				onClose: () => ModalToOpenService.resetValue(),
			});
		},
		[deleteView],
	);

	const canEditCatalog = PermissionService.useCheckPermission(editCatalogPermission, workspace.path, catalogName);
	const isEditInstant = isTauri || isBrowser;
	const canEditCatalogViews = canEditCatalog && isEditInstant && !isReadOnly;
	if (!isCatalogExist || (!isEditInstant && !hasViews)) return;

	return (
		<Popover onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<ButtonLink
					disabled={!isEditInstant && !hasViews}
					iconCode="layers"
					rightActions={[<Icon icon="chevron-down" key="chevron-down" />]}
					text={catalogView?.name || t("catalog.views.trigger")}
				/>
			</PopoverTrigger>
			<CatalogViewSettingsContent
				editable={canEditCatalogViews}
				hasMoreRef={hasMoreRef}
				hasViews={hasViews}
				isLoading={isLoading}
				items={items}
				onDeleteClick={onDeleteClick}
				onLoadMore={onLoadMore}
				onSaveClick={canEditCatalogViews ? createView : undefined}
				onUpdateClick={canEditCatalogViews ? updateView : undefined}
				onUpdateDocportalVisible={canEditCatalogViews ? onUpdateDocportalVisible : undefined}
			/>
		</Popover>
	);
});
