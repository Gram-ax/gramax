import useShouldRenderDeleteCatalog from "@components/Actions/useShouldRenderDeleteCatalog";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { applyMenuModifiers, useIsPluginReady } from "@plugins/store";
import useValidateDeleteCatalogInStatic from "@ext/static/logic/useValidateDeleteCatalogInStatic";
import { Button } from "@ui-kit/Button";
import { FC, Fragment, ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { CatalogActionsProvider, useCatalogActionsContext } from "./CatalogActionsContext";
import { buildCatalogMenu, MenuItemDescriptorApp } from "./buildCatalogMenu";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";

interface CatalogActionsProps {
	isCatalogExist: boolean;
	itemLinks: ItemLink[];
	currentTab: LeftNavigationTab;
}

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
			itemLinks={itemLinks}
			currentTab={currentTab}
			setCurrentTab={setCurrentTab}
			renderDeleteCatalog={renderDeleteCatalog}
		>
			<NavigationDropdown
				onOpen={onOpen}
				tooltipText={t("catalog.actions.title")}
				dataQa="qa-catalog-actions"
				style={{ marginRight: "-4px" }}
				trigger={
					<Button variant="text" size="xs" className="p-0 h-full">
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
