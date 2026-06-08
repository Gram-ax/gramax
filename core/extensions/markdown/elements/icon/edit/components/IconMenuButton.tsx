import { useBaseLucideIconList } from "@components/Atoms/Icon/lucideIconList";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { useLazySearchList } from "@core-ui/hooks/useLazySearchList";
import t from "@ext/localization/locale/translate";
import type { IconEditorProps } from "@ext/markdown/elements/icon/edit/model/types";
import CustomIcon from "@ext/markdown/elements/icon/render/components/Icon";
import type { Editor } from "@tiptap/core";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@ui-kit/Command";
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { LoadMoreTrigger } from "@ui-kit/LoadMoreTrigger";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { memo, useCallback, useMemo, useRef, useState } from "react";

interface IconMenuButtonProps {
	editor: Editor;
}

type IconOption = {
	value: string;
	label: string;
	svg?: string;
	type: string;
};

const IconMenuButton = ({ editor }: IconMenuButtonProps) => {
	const [customIconsList, setCustomIconsList] = useState<IconEditorProps[]>([]);
	const listRef = useRef<HTMLDivElement>(null);

	const { disabled } = ButtonStateService.useCurrentAction({ action: "icon" });
	const lucideIconList = useBaseLucideIconList();

	const { call: getIcons, status } = useApi<IconEditorProps[], IconEditorProps[]>({
		url: (api) => api.getCustomIconsList(),
		onDone: (data) => {
			if (JSON.stringify(data) === JSON.stringify(customIconsList)) return;
			setCustomIconsList(data);
		},
	});

	const insertCustomIcon = useCallback(
		(code: string) => {
			editor
				.chain()
				.setIcon({ code, svg: customIconsList.find((i) => i.code === code)?.svg })
				.focus(editor.state.selection.anchor)
				.run();
		},
		[editor, customIconsList],
	);

	const allOptions = useMemo(() => {
		return [
			...customIconsList.map((icon) => ({ value: icon.code, label: icon.code, type: "custom", svg: icon.svg })),
			...lucideIconList.map((icon) => ({ value: icon.value, label: icon.label, type: "lucide" })),
		];
	}, [customIconsList, lucideIconList]);

	const filter = useCallback((option: IconOption, searchQuery: string) => {
		if (!searchQuery) return 0;
		if (option.value.toLowerCase().includes(searchQuery.toLowerCase())) return 2;
		if (option.label.toLowerCase().includes(searchQuery.toLowerCase())) return 1;
		return 0;
	}, []);

	const { visibleOptions, hasMoreItems, handleLoadMore, handleSearchChange, handleOpenChange } =
		useLazySearchList<IconOption>({
			pageSize: 30,
			options: allOptions,
			filter,
			value: "",
			defaultValue: "",
		});

	const insertLucideIcon = useCallback(
		(labelField: string) => {
			editor.chain().setIcon({ code: labelField }).focus(editor.state.selection.anchor).run();
		},
		[editor],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			handleOpenChange(open);
			if (open && status !== RequestStatus.Loading) getIcons();
		},
		[getIcons, status, handleOpenChange],
	);

	const customList = useMemo(() => {
		return visibleOptions.filter((option) => option.type === "custom");
	}, [visibleOptions]);

	const lucideList = useMemo(() => {
		return visibleOptions.filter((option) => option.type === "lucide");
	}, [visibleOptions]);

	return (
		<DropdownMenuSub onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger disabled={disabled}>
				<div className="flex flex-row items-center gap-2 w-full">
					<Icon icon="smile" />
					{t("icon")}
				</div>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="shadow-hard-base max-w-56" ref={listRef} sideOffset={8}>
				<Command shouldFilter={false}>
					<CommandInput onValueChange={handleSearchChange} placeholder={t("icon-cone")} />
					<CommandList>
						<CommandEmpty>{t("list.no-results-found")}</CommandEmpty>
						{(status !== RequestStatus.Ready || customList.length !== 0) && (
							<CommandGroup heading={t("catalog-icons-title")}>
								{status === RequestStatus.Ready ? (
									customList.map((icon) => (
										<CommandItem key={icon.value} onSelect={() => insertCustomIcon(icon.value)}>
											<div className="flex flex-row items-center gap-2 overflow-hidden">
												<CustomIcon code={icon.value} svg={icon.svg} />
												<TextOverflowTooltip>{icon.label}</TextOverflowTooltip>
											</div>
										</CommandItem>
									))
								) : (
									<CommandItem disabled>
										<div className="flex flex-row items-center gap-2">
											<Loader size="sm" />
											{t("loading")}
										</div>
									</CommandItem>
								)}
							</CommandGroup>
						)}
						{lucideList.length > 0 && (
							<CommandGroup heading={t("system-icons-title")}>
								{lucideList.map((icon) => (
									<CommandItem key={icon.value} onSelect={() => insertLucideIcon(icon.value)}>
										<div className="flex flex-row items-center gap-2 overflow-hidden">
											<Icon icon={icon.value} />
											<TextOverflowTooltip>{icon.label}</TextOverflowTooltip>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						)}
						<LoadMoreTrigger hasMore={hasMoreItems} onLoad={handleLoadMore} />
					</CommandList>
				</Command>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default memo(IconMenuButton);
