import { MenuItemDescriptorApp } from "@components/Actions/CatalogActions/buildCatalogMenu";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { MenuItem } from "@plugins/api/sdk";
import { PluginRegistry } from "@plugins/registry/PluginRegistry";
import { MenuRegistryInterface } from "@plugins/types";
import type { CoreMenuItemId, MenuContext, MenuItemDescriptor, MenuModifier } from "@gramax/sdk/ui";

export class PluginMenuRegistry extends PluginRegistry<string, MenuModifier[]> implements MenuRegistryInterface {
	registerModifier(pluginId: string, modifier: MenuModifier): void {
		if (!this.data.has(pluginId)) {
			this.data.set(pluginId, []);
		}

		const modifiers = this.data.get(pluginId);
		modifiers.push(modifier);
	}

	async applyModifiers(items: MenuItemDescriptorApp[], context: MenuContext): Promise<Array<MenuItemDescriptorApp>> {
		if (!this.data.size) return items;

		const allModifiers = Array.from(this.data.values()).flat();
		if (!allModifiers.length) return items;

		let result: Array<MenuItemDescriptorApp> = items.map((item) => ({ ...item })) as MenuItemDescriptorApp[];

		for (const modifier of allModifiers) {
			const modified = await modifier(result as MenuItemDescriptor<CoreMenuItemId>[], context);
			if (modified) result = this.normalizeItems(modified);
		}

		return result;
	}

	private normalizeItems(items: Array<MenuItemDescriptor<CoreMenuItemId> | MenuItemDescriptor<string>>) {
		return items.map((item) => {
			const { component, children, visible } = item;
			const isMenuItem = component && typeof component === "object" && "isMenuItem" in component;

			if (!isMenuItem) {
				return children?.length ? { ...item, children: this.normalizeItems(children) } : item;
			}

			const { id, label, icon, onClick } = (component as MenuItem).getProps();

			return {
				id,
				visible,
				children: children?.length ? this.normalizeItems(children) : undefined,
				component: (children?: React.ReactNode) => (
					<CatalogItem
						renderLabel={(Component) => (
							<Component onClick={onClick}>
								{icon && <Icon code={icon} />}
								{label}
							</Component>
						)}
					>
						{children}
					</CatalogItem>
				),
			} as MenuItemDescriptor<CoreMenuItemId>;
		});
	}

	remove(pluginId: string): void {
		this.data.delete(pluginId);
	}

	clear(): void {
		this.data.clear();
	}
}
