import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { ReactNode } from "react";

type CatalogItemPropsWithChildren = {
	children: ReactNode | ((props?: any) => ReactNode);
	renderLabel: (props: typeof DropdownMenuSubTrigger) => ReactNode;
};

type CatalogItemPropsWithoutChildren = {
	children?: never;
	renderLabel: (props: typeof DropdownMenuItem) => ReactNode;
};

export type CatalogItemProps = CatalogItemPropsWithChildren | CatalogItemPropsWithoutChildren;

function CatalogItem(props: CatalogItemPropsWithChildren);
function CatalogItem(props: CatalogItemPropsWithoutChildren);
function CatalogItem(props: CatalogItemProps) {
	if (props.children) {
		const { children, renderLabel } = props as CatalogItemPropsWithChildren;
		return (
			<DropdownMenuSub>
				{renderLabel(DropdownMenuSubTrigger)}
				<DropdownMenuSubContent>
					{typeof children === "function" ? children() : children}
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	}

	const { renderLabel } = props as CatalogItemPropsWithoutChildren;
	return <DropdownMenuSub>{renderLabel(DropdownMenuItem)}</DropdownMenuSub>;
}

export default CatalogItem;
