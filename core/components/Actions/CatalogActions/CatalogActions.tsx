import useShouldRenderDeleteCatalog from "@components/Actions/useShouldRenderDeleteCatalog";
import Icon from "@components/Atoms/Icon";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import type { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import useValidateDeleteCatalogInStatic from "@ext/static/logic/useValidateDeleteCatalogInStatic";
import { applyMenuModifiers } from "@plugins/store";
import { Button } from "@ui-kit/Button";
import { type FC, Fragment, type ReactNode, useEffect, useState } from "react";
import { buildCatalogMenu, type MenuItemDescriptorApp } from "./buildCatalogMenu";
import { CatalogActionsProvider, useCatalogActionsContext } from "./CatalogActionsContext";

interface CatalogActionsProps {
	isCatalogExist: boolean;
	itemLinks: ItemLink[];
	currentTab: LeftNavigationTab;
}

// biome-ignore lint/suspicious/noExplicitAny: idc
type RenderPropsFunction = (props: any) => ReactNode;
type MenuChildrenContent = ReactNode | RenderPropsFunction | undefined;

const renderMenuItems = (items: MenuItemDescriptorApp[]): ReactNode => {
	return items
		.filter((item) => item.visible)
		.map((item) => {
			let childrenContent: MenuChildrenContent;

			if (item.children?.length) {
				childrenContent = (props) => {
					const childItems = item.children.map((child) => ({
						...child,
						component: () => (child.component as RenderPropsFunction)(props),
					}));
					return renderMenuItems(childItems);
				};
			}

			const component = item.component as RenderPropsFunction;
			const content = component(childrenContent);

			return <Fragment key={item.id}>{content}</Fragment>;
		});
};

const CatalogActionsMenu: FC = () => {
	const ctx = useCatalogActionsContext();
	const [menuItems, setMenuItems] = useState<MenuItemDescriptorApp[]>([]);

	useWatch(() => {
		const applyModifiers = async () => {
			const baseItems = buildCatalogMenu(ctx);
			const modifiedItems = await applyMenuModifiers(baseItems, ctx.pluginContext);
			setMenuItems(modifiedItems);
		};
		applyModifiers();
	}, [ctx.pluginContext]);

	return renderMenuItems(menuItems);
};

const CatalogActions: FC<CatalogActionsProps> = ({ isCatalogExist, itemLinks, currentTab }) => {
	const shouldRenderDeleteCatalog = useShouldRenderDeleteCatalog();
	const [renderDeleteCatalog, setRenderDeleteCatalog] = useState(false);
	const validateDeleteCatalogInStatic = useValidateDeleteCatalogInStatic();
	const { isStatic } = usePlatform();

	useEffect(() => {
		setRenderDeleteCatalog(shouldRenderDeleteCatalog);
	}, [shouldRenderDeleteCatalog]);

	if (!isCatalogExist) return null;

	const onOpen = async () => {
		if (!shouldRenderDeleteCatalog || !isStatic) return;
		setRenderDeleteCatalog(await validateDeleteCatalogInStatic());
	};

	const setCurrentTab = (tab: LeftNavigationTab) => {
		NavigationTabsService.setTop(tab);
	};

	return (
		<CatalogActionsProvider
			currentTab={currentTab}
			itemLinks={itemLinks}
			renderDeleteCatalog={renderDeleteCatalog}
			setCurrentTab={setCurrentTab}
		>
			<NavigationDropdown
				dataQa="qa-catalog-actions"
				dataTestId="catalog-actions"
				onOpen={onOpen}
				style={{ marginRight: "-4px" }}
				tooltipText={t("catalog.actions.title")}
				trigger={
					<Button className="p-0 h-full" size="xs" variant="text">
						<Icon code="ellipsis-vertical" style={{ fontSize: "1.7em" }} />
					</Button>
				}
			>
				<CatalogActionsMenu />
			</NavigationDropdown>
		</CatalogActionsProvider>
	);
};

export default CatalogActions;
