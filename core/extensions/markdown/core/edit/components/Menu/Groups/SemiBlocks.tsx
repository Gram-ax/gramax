import t from "@ext/localization/locale/translate";
import useSemiBlocksMenu, {
	SECTION_LABELS,
} from "@ext/markdown/core/edit/components/Menu/Groups/hooks/useSemiBlocksMenu";
import type { Editor } from "@tiptap/core";
import {
	DropdownEmpty,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSearchItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarIcon, ToolbarTriggerChevron } from "@ui-kit/Toolbar";
import { Fragment, useCallback, useRef, useState } from "react";

interface SemiBlocksProps {
	editor?: Editor;
	includeResources?: boolean;
	fileName?: string;
	isSmallEditor?: boolean;
}

const SemiBlocks = ({ editor, includeResources, fileName, isSmallEditor }: SemiBlocksProps) => {
	const listRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number>(null);
	const [fixedHeight, setFixedHeight] = useState<number>(null);

	const {
		isOpen,
		search,
		setSearch,
		inputRef,
		handleContentKeyDown,
		handleInputKeyDown,
		onOpenChange: onOpenChangeBase,
		renderedSections,
		hasDiagrams,
		hasFiles,
		hasTools,
		isActived,
		disabled,
	} = useSemiBlocksMenu({ editor, fileName, isSmallEditor, includeResources });

	const onCloseAutoFocus = useCallback(
		(event: Event) => {
			event.preventDefault();
			editor.commands.focus();
		},
		[editor],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				rafRef.current = requestAnimationFrame(() => {
					if (listRef.current) setFixedHeight(listRef.current.offsetHeight);
				});
			} else {
				if (rafRef.current) cancelAnimationFrame(rafRef.current);
				setFixedHeight(null);
			}

			onOpenChangeBase(open);
		},
		[onOpenChangeBase],
	);

	if (!hasDiagrams && !hasFiles && !hasTools) return null;

	return (
		<ComponentVariantProvider variant="inverse">
			<DropdownMenu onOpenChange={onOpenChange} open={isOpen}>
				<DropdownMenuTrigger asChild>
					<ToolbarTriggerChevron
						active={isActived}
						className="p-1 py-1"
						data-testid="tb-semi-blocks"
						disabled={disabled}
					>
						<ToolbarIcon icon="pencil-ruler" />
					</ToolbarTriggerChevron>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="shadow-hard-base overflow-hidden"
					onCloseAutoFocus={onCloseAutoFocus}
					onKeyDown={handleContentKeyDown}
					side="top"
					sideOffset={8}
				>
					<DropdownMenuSearchItem
						onChange={(e) => setSearch(e.target.value)}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={handleInputKeyDown}
						placeholder={t("search.placeholder")}
						ref={inputRef}
						value={search}
					/>
					<DropdownMenuSeparator />
					<div
						className="flex flex-col overflow-x-hidden overflow-y-auto max-h-1/2 lg:max-h-[30rem]"
						ref={listRef}
						style={fixedHeight != null ? { height: fixedHeight } : undefined}
					>
						{renderedSections.length === 0 ? (
							<DropdownEmpty>{t("list.no-results-found")}</DropdownEmpty>
						) : (
							renderedSections.map((items, i) => (
								<Fragment key={items[0].section}>
									{i > 0 && <DropdownMenuSeparator />}
									<DropdownMenuLabel className="font-normal text-inverse-muted">
										{SECTION_LABELS[items[0].section]()}
									</DropdownMenuLabel>
									{items.map((item) => (
										<Fragment key={item.key}>{item.node}</Fragment>
									))}
								</Fragment>
							))
						)}
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</ComponentVariantProvider>
	);
};

export default SemiBlocks;
