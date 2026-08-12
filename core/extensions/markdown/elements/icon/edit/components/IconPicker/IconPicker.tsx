import { updateLastUsedIcons } from "@components/Atoms/Icon/IconDataStore";
import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { cn } from "@core-ui/utils/cn";
import type { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import { EmojiPicker } from "@ext/markdown/elements/icon/edit/components/IconPicker/Emoji/EmojiPicker";
import { FileInput } from "@ext/markdown/elements/icon/edit/components/IconPicker/FileInput/FIleInput";
import { IconPickerVirtualList } from "@ext/markdown/elements/icon/edit/components/IconPicker/Icon/IconPickerVirtualList";
import { IconPickerSearchBar } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerSearchBar";
import type { IconPickerTab } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerToggleGroup";
import { IconPickerToggleGroup } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerToggleGroup";
import { useIconPicker } from "@ext/markdown/elements/icon/logic/hooks/useIconPicker";
import type { IconPickerSize } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import { getIconPickerWidth } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import { updateLastUsedEmojis, useEmojiData } from "@ext/markdown/elements/icon/logic/stores/EmojiDataStore";
import type { FileValue } from "@ui-kit/Input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type IconPickerValue =
	| { code: IconCode; svg?: string; color?: IconPickerColor }
	| { emoji: string }
	| { file: FileValue };

export type OnChangeCallback = (props: IconPickerValue) => void;

export type IconPickerDisableOption = (IconPickerTab | "color")[];

export interface IconPickerOptions {
	value?: IconPickerValue;
	color?: IconPickerColor;
	onChange?: OnChangeCallback;
	size?: IconPickerSize;
	disable?: IconPickerDisableOption;
	disableCatalogIcons?: boolean;
}

export type IconPickerColor = (typeof HIGHLIGHT_COLOR_NAMES)[keyof typeof HIGHLIGHT_COLOR_NAMES];

type IconPickerProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & IconPickerOptions;

export const IconPicker = (props: IconPickerProps) => {
	const {
		value,
		onChange,
		size = "sm",
		className,
		disable = [],
		disableCatalogIcons = false,
		color,
		...rest
	} = props;
	const [query, setQuery] = useState("");
	const [tab, setTab] = useState<IconPickerTab>("icons");
	const [fixedHeight, setFixedHeight] = useState<number>(null);
	const [iconColor, setIconColor] = useState<IconPickerColor>(color ?? null);

	useEffect(() => {
		setIconColor(color ?? null);
	}, [color]);
	const containerRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (containerRef.current && !fixedHeight) {
			setFixedHeight(containerRef.current.getBoundingClientRect().height);
		}
	}, []);

	const { icons, categories } = useIconPicker(disableCatalogIcons);
	const emojis = useEmojiData();

	const virtualIcons = useMemo(() => {
		const q = query.toLowerCase();

		if (Array.isArray(icons)) {
			return q ? icons.filter((e) => e.code.includes(q)) : icons;
		}

		const grouped = Object.fromEntries(Object.entries(icons).map(([cat, items]) => [cat, items]));

		if (!q) return grouped;

		return Object.values(grouped)
			.flat()
			.filter((e) => e.code.includes(q));
	}, [icons, query]);

	const isSearching = Array.isArray(virtualIcons);
	const hasCategories = !isSearching && Object.keys(categories).length > 0;

	const handleIconChange = useCallback(
		(props: { code: IconCode; svg?: string; color?: IconPickerColor }) => {
			const cleanCode = props.code.startsWith("custom:") ? props.code.slice("custom:".length) : props.code;
			updateLastUsedIcons(props.svg ? `custom:${cleanCode}` : cleanCode);
			onChange?.({ ...props, code: cleanCode as IconCode, color: iconColor });
		},
		[onChange, iconColor],
	);

	const handleEmojiChange = useCallback(
		(emoji: string) => {
			updateLastUsedEmojis(emoji);
			onChange?.({ emoji: emoji });
		},
		[onChange],
	);

	const handleFileChange = useCallback(
		(file: FileValue) => {
			onChange?.({ file: file });
		},
		[onChange],
	);

	const handleTabChange = useCallback((value: string) => {
		if (value) setTab(value as IconPickerTab);
	}, []);

	return (
		<div
			className={cn(className, "flex flex-col")}
			ref={containerRef}
			style={{ width: getIconPickerWidth(size), height: fixedHeight }}
			{...rest}
		>
			<IconPickerToggleGroup disable={disable} onTabChange={handleTabChange} tab={tab} />
			{tab !== "file-input" && (
				<IconPickerSearchBar
					disable={disable}
					iconColor={iconColor}
					onChange={setQuery}
					setIconColor={setIconColor}
					tab={tab}
					value={query}
				/>
			)}
			{tab === "icons" && (
				<IconPickerVirtualList
					categories={categories}
					color={iconColor}
					hasCategories={hasCategories}
					icons={virtualIcons}
					key={String(isSearching)}
					onChange={handleIconChange}
					size={size}
				/>
			)}
			{tab === "emoji" && <EmojiPicker emojis={emojis} onChange={handleEmojiChange} query={query} size={size} />}
			{tab === "file-input" && (
				<FileInput onChange={handleFileChange} value={(value as { file: FileValue })?.file} />
			)}
		</div>
	);
};
