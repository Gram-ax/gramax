import type LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import { LinkHeadings } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkHeadings";
import { CommandItem } from "@ui-kit/Command";
import { Icon } from "@ui-kit/Icon";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

export type ItemLinkOption = Omit<SearchSelectOption, "value"> & LinkItem & { value: string };

export interface LinkMenuItemProps {
	option: ItemLinkOption;
	icon: string;
	depth: number;
	onUpdate: (relativePath: string, newHref: string) => void;
}

export const LinkMenuItem = (props: LinkMenuItemProps) => {
	const { option, icon, depth, onUpdate } = props;

	return (
		<CommandItem
			className="px-2 py-1 pr-1"
			key={option.value}
			onSelect={() => onUpdate(option.relativePath, option.pathname)}
			value={`${option.value}`}
		>
			<div
				className="flex items-center gap-2 overflow-hidden"
				style={{ paddingLeft: `calc((0.5rem + 0.875rem) * ${depth})` }}
			>
				<Icon className="w-3.5 h-3.5" icon={icon} />
				<TextOverflowTooltip className="truncate whitespace-nowrap text-xs">{option.label}</TextOverflowTooltip>
			</div>
			<LinkHeadings linkItem={option} onUpdate={onUpdate} />
		</CommandItem>
	);
};
