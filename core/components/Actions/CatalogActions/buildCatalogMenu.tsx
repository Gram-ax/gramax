import AiPromptItem from "@components/Actions/CatalogItems/AiPromptItem";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import CatalogMoveItem, { CatalogMoveSelectItem } from "@components/Actions/CatalogItems/CatalogMoveItem";
import ExportCatalogItem from "@components/Actions/CatalogItems/ExportCatalogItem";
import ExportMenuItem from "@components/Actions/CatalogItems/ExportMenuItem";
import FavoriteMenuItem from "@components/Actions/CatalogItems/FavoriteMenuItem";
import HealthcheckItem from "@components/Actions/CatalogItems/HealthcheckItem";
import LfsLazyToggleItem from "@components/Actions/CatalogItems/LfsLazyToggleItem";
import NotesItem from "@components/Actions/CatalogItems/NotesItem";
import RepositoryPermissionItem from "@components/Actions/CatalogItems/RepositoryPermissionItem";
import ShareCatalogItem from "@components/Actions/CatalogItems/ShareCatalogItem";
import SharedTicketTrigger from "@components/Actions/CatalogItems/SharedTicketTrigger";
import SnippetsItem from "@components/Actions/CatalogItems/SnippetsItem";
import TemplateItem from "@components/Actions/CatalogItems/TemplateItem";
import ViewFavoritesItem from "@components/Actions/CatalogItems/ViewFavoritesItem";
import Icon from "@components/Atoms/Icon";
import { PlatformServiceNew } from "@core-ui/PlatformService";
import type { CatalogMoveActionRenderProps } from "@ext/catalog/actions/move/components/CatalogMoveAction";
import CatalogPropsTrigger from "@ext/catalog/actions/propsEditor/components/CatalogPropsTrigger";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import t from "@ext/localization/locale/translate";
import openCloudModal from "@ext/static/components/openCloudModal";
import { feature } from "@ext/toggleFeatures/features";
import { ExportFormat } from "@ext/wordExport/components/ItemExport";
import type { CoreMenuItemId } from "@gramax/sdk/ui";
import { DropdownMenuLabel, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import type { ReactNode } from "react";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import DownloadZip from "../DownloadZip";
import ShowInExplorer from "../ShowInExplorer";
import type { CatalogActionsContextValue } from "./CatalogActionsContext";

type CoreMenuItemIdNew =
	| "navigation-title"
	| "separator"
	| "repository-permission"
	| "favorite-articles"
	| "lfs-lazy-toggle";

export type CoreMenuItemIdApp = CoreMenuItemId | CoreMenuItemIdNew;

export interface MenuItemPropMap {
	"navigation-title": ReactNode;
	separator: ReactNode;
	"catalog-settings": ReactNode;
	"share-ticket": ReactNode;
	"share-catalog": ReactNode;
	"show-in-explorer": ReactNode;
	export: (() => ReactNode) | undefined;
	"export-docx": ReactNode;
	"export-pdf": ReactNode;
	"export-zip": ReactNode;
	"publish-to-cloud": ReactNode;
	"toggle-favorite": ReactNode;
	"view-favorites": ReactNode;
	notes: ReactNode;
	"catalog-tools": ReactNode;
	snippets: ReactNode;
	template: ReactNode;
	"ai-prompt": ReactNode;
	healthcheck: ReactNode;
	"delete-catalog": ReactNode;
	"catalog-move": (props: CatalogMoveActionRenderProps) => ReactNode;
	"catalog-move-select": CatalogMoveActionRenderProps;
	"repository-permission": ReactNode;
	"favorite-articles": ReactNode;
	"lfs-lazy-toggle": ReactNode;
}

export type MenuItemDescriptorApp = {
	[K in CoreMenuItemIdApp]: {
		id: K;
		component: (props: MenuItemPropMap[K]) => React.ReactNode;
		children?: MenuItemDescriptorApp[];
		visible?: boolean;
	};
}[CoreMenuItemIdApp];

export function buildCatalogMenu(ctx: CatalogActionsContextValue): MenuItemDescriptorApp[] {
	const { canConfigure, hasGesUrl, isAiEnabled, renderDeleteCatalog, isMac, isReadOnly, cloudServiceUrl, hasSource } =
		ctx;
	const platform = PlatformServiceNew;

	const showMainMenu =
		(!platform.isStatic && !platform.isStaticCli) || !platform.isDocPortal || (canConfigure && !isReadOnly);

	const showAccessMenu =
		(hasGesUrl && canConfigure && (platform.isBrowser || platform.isDesktop)) ||
		(canConfigure && platform.isDocPortal);

	const showToolsMenu = !isReadOnly;

	return [
		{
			id: "navigation-title",
			component: () => (
				<>
					<DropdownMenuLabel className="text-primary-fg">{t("catalog.actions.title")}</DropdownMenuLabel>
					<DropdownMenuSeparator />
				</>
			),
			visible: true,
		},
		{
			id: "catalog-settings",
			component: (children) => <CatalogPropsTrigger>{children}</CatalogPropsTrigger>,
			visible: canConfigure && !isReadOnly,
		},
		{
			id: "share-catalog",
			component: (children) => <ShareCatalogItem>{children}</ShareCatalogItem>,
			visible: !platform.isDocPortal && hasSource,
		},
		{
			id: "toggle-favorite",
			visible: !platform.isStatic && !platform.isStaticCli,
			component: (children) => <FavoriteMenuItem>{children}</FavoriteMenuItem>,
		},
		{
			id: "view-favorites",
			visible: !platform.isStatic && !platform.isStaticCli,
			component: (children) => <ViewFavoritesItem>{children}</ViewFavoritesItem>,
		},
		{
			id: "catalog-move",
			component: (children) => <CatalogMoveItem>{children}</CatalogMoveItem>,
			visible: !platform.isStatic && !platform.isStaticCli && !platform.isDocPortal,
			children: [
				{
					id: "catalog-move-select",
					component: ({ targetWorkspaceRef, checkAndMove }) => (
						<CatalogMoveSelectItem checkAndMove={checkAndMove} targetWorkspaceRef={targetWorkspaceRef} />
					),
					visible: true,
				},
			],
		},
		{
			id: "separator",
			component: () => <DropdownMenuSeparator />,
			visible: showMainMenu,
		},
		{
			id: "share-ticket",
			component: (children) => <SharedTicketTrigger>{children}</SharedTicketTrigger>,
			visible: canConfigure && platform.isDocPortal,
		},
		{
			id: "repository-permission",
			component: (children) => <RepositoryPermissionItem>{children}</RepositoryPermissionItem>,
			visible: hasGesUrl && canConfigure && (platform.isBrowser || platform.isDesktop),
		},
		{
			id: "separator",
			component: () => <DropdownMenuSeparator />,
			visible: showAccessMenu && !isReadOnly,
		},
		{
			id: "catalog-tools",
			visible: !isReadOnly,
			component: (children) => (
				<IsReadOnlyHOC>
					<CatalogItem
						renderLabel={(Item) => (
							<Item>
								<Icon code="tool-case" />
								{t("tools")}
							</Item>
						)}
					>
						{children}
					</CatalogItem>
				</IsReadOnlyHOC>
			),
			children: [
				{
					id: "snippets",
					component: (children) => <SnippetsItem>{children}</SnippetsItem>,
					visible: true,
				},
				{
					id: "template",
					component: (children) => <TemplateItem>{children}</TemplateItem>,
					visible: true,
				},
				{
					id: "ai-prompt",
					component: (children) => <AiPromptItem>{children}</AiPromptItem>,
					visible: isAiEnabled,
				},
				{
					id: "lfs-lazy-toggle",
					component: (children) => <LfsLazyToggleItem>{children}</LfsLazyToggleItem>,
					visible: hasSource,
				},
			],
		},
		{
			id: "notes",
			visible: !isReadOnly,
			component: (children) => <NotesItem>{children}</NotesItem>,
		},
		{
			id: "separator",
			component: () => <DropdownMenuSeparator />,
			visible: showToolsMenu,
		},
		{
			id: "show-in-explorer",
			component: () => <ShowInExplorer />,
			visible: platform.isDesktop,
		},
		{
			id: "export",
			component: (children) => <ExportCatalogItem>{children}</ExportCatalogItem>,
			visible: true,
			children: [
				{
					id: "export-docx",
					component: () => <ExportMenuItem exportFormat={ExportFormat.docx} />,
					visible: true,
				},
				{
					id: "export-pdf",
					component: () => <ExportMenuItem exportFormat={ExportFormat.pdf} />,
					visible: true,
				},
				{
					id: "export-zip",
					component: () => <DownloadZip />,
					visible: true,
				},
			],
		},
		{
			id: "publish-to-cloud",
			component: (children) => (
				<CatalogItem
					renderLabel={(Item) => (
						<Item onSelect={openCloudModal}>
							<Icon code="cloud-upload" />
							{t("cloud.publish-to-cloud")}
						</Item>
					)}
				>
					{children}
				</CatalogItem>
			),
			visible: !(isMac && platform.isDesktop) && !!cloudServiceUrl && feature("cloud"),
		},
		{
			id: "separator",
			component: () => <DropdownMenuSeparator />,
			visible: !isReadOnly,
		},
		{
			id: "healthcheck",
			visible: !isReadOnly,
			component: (children) => <HealthcheckItem>{children}</HealthcheckItem>,
		},
		{
			id: "separator",
			component: () => <DropdownMenuSeparator />,
			visible: renderDeleteCatalog,
		},
		{
			id: "delete-catalog",
			component: (children) => <DeleteCatalog>{children}</DeleteCatalog>,
			visible: renderDeleteCatalog,
		},
	] as const;
}
