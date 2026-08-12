import { IconPickerItem } from "@ext/markdown/elements/icon/edit/components/IconPicker/Icon/IconPickerItem";
import type {
	IconPickerColor,
	OnChangeCallback,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { IconPickerLabel } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerLabel";
import { getIconPickerCategoryName } from "@ext/markdown/elements/icon/edit/logic/getIconPickerCategoryName";
import type { VirtualRow } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import type { Virtualizer } from "@tanstack/react-virtual";

interface IconPickerListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
	virtualizer: Virtualizer<Element, Element>;
	rows: VirtualRow[];
	color?: IconPickerColor;
	onChange?: OnChangeCallback;
}

export const IconPickerList = ({ color, virtualizer, rows, onChange, ...props }: IconPickerListProps) => {
	const totalSize = virtualizer.getTotalSize();
	const virtualItems = virtualizer.getVirtualItems();

	return (
		<div style={{ height: totalSize, position: "relative" }} {...props}>
			{virtualItems.map((item) => {
				const row = rows[item.index];
				if (!row) return null;
				return (
					<div
						key={item.key}
						style={{ position: "absolute", top: item.start, left: 0, right: 0, height: item.size }}
					>
						{row.type === "label" ? (
							<IconPickerLabel className="flex items-center h-full">
								{getIconPickerCategoryName(row.category)}
							</IconPickerLabel>
						) : (
							<div className="flex gap-1.5">
								{row.icons.map((entry, i) => (
									<IconPickerItem
										code={entry.code}
										color={color}
										key={`${item.index}-${i}`}
										onClick={onChange}
										svg={entry.svg}
									/>
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
