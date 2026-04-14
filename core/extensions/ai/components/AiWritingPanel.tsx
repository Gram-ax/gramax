import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { AiToolbarButton } from "@ext/ai/components/Helpers/AiToolbarButton";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuEmptyItem,
	DropdownMenuItem,
	DropdownMenuSearchItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	useSearchableMenu,
} from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { Toolbar, ToolbarDropdownMenuContent, ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import {
	type ChangeEvent,
	type Dispatch,
	type KeyboardEvent,
	memo,
	type SetStateAction,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

interface AiWritingPanelProps {
	placeholder: string;
	setOpen: Dispatch<SetStateAction<boolean>>;
	onSubmit: (command: string) => void;
	closeHandler?: () => void;
}

interface PromptListProps {
	onClick: (command: string) => void;
}

const StyledTextareaWrapper = styled.div`
	& textarea {
		border: none !important;
		background: transparent !important;
		box-shadow: none !important;
		color: hsl(var(--inverse-primary-fg)) !important;
		padding: 0;
		border-radius: 0;
	}
`;

const PromptList = ({ onClick }: PromptListProps) => {
	const [list, setList] = useState<ProviderItemProps[]>([]);
	const [open, setOpen] = useState(false);
	const [height, setHeight] = useState<string>(null);
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const { call: getPrompts, status } = useApi<ProviderItemProps[]>({
		url: (api) => api.getArticleListInGramaxDir("prompt"),
		onDone: (data) => setList(data),
	});

	const onOpenChange = (open: boolean) => {
		setOpen(open);
		if (open && status === RequestStatus.Init) getPrompts();
	};

	const { search, setSearch, contentRef, inputRef, handleContentKeyDown, handleInputKeyDown, filterItems } =
		useSearchableMenu();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		if (!open) return;
		const measure = () => {
			const subContent = contentRef.current;
			if (subContent) {
				setHeight(`${subContent.offsetHeight}px`);
			}
		};
		requestAnimationFrame(measure);
	}, [open, list]);

	const filteredPrompts = useMemo(
		() => filterItems(list.map((prompt) => ({ ...prompt, label: prompt.title }))),
		[list, filterItems],
	);

	return (
		<ComponentVariantProvider variant="inverse">
			<DropdownMenu onOpenChange={onOpenChange}>
				<DropdownMenuTrigger asChild>
					<ToolbarToggleButton
						active={open}
						className="flex-shrink-0"
						focusable
						tooltipText={t("ai.ai-prompts")}
					>
						<ToolbarIcon icon="list" />
					</ToolbarToggleButton>
				</DropdownMenuTrigger>
				<ToolbarDropdownMenuContent
					contentClassName={cn(!open && "pointer-events-none", "lg:shadow-hard-base")}
					contentStyle={{
						maxWidth: "calc(min(14rem, var(--radix-popover-content-available-width, 100%)))",
						height: !filteredPrompts.length ? "unset" : height,
						maxHeight: !filteredPrompts.length ? "unset" : height,
						overflowY: "auto",
						boxShadow: "none",
					}}
					onKeyDown={handleContentKeyDown}
					ref={contentRef}
					side="top"
					sideOffset={!isMobile ? 8 : 0}
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
					<div className="h-full" style={{ maxHeight: "11rem", overflowY: "auto" }}>
						{filteredPrompts.length === 0 ? (
							<DropdownMenuEmptyItem>{t("ai.no-prompts")}</DropdownMenuEmptyItem>
						) : (
							filteredPrompts.map((prompt) => (
								<DropdownMenuItem
									key={prompt.id}
									onClick={() => onClick(prompt.id)}
									textValue={prompt.title}
								>
									{prompt.title}
								</DropdownMenuItem>
							))
						)}
					</div>
				</ToolbarDropdownMenuContent>
			</DropdownMenu>
		</ComponentVariantProvider>
	);
};

export const AiWritingPanel = memo(({ closeHandler, onSubmit, placeholder }: AiWritingPanelProps) => {
	const [disabled, setDisabled] = useState(true);
	const value = useRef<string>("");

	const onClick = useCallback(
		(command: string) => {
			onSubmit(command);
			closeHandler?.();
		},
		[onSubmit, closeHandler],
	);

	const onClickSend = useCallback(() => {
		if (!value.current?.length) return;
		onClick(value.current);
	}, [onClick]);

	const onInput = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
		value.current = e.target.value;
		setDisabled(!e.target.value.length);
	}, []);

	const onEnter = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onClickSend();
		},
		[onClickSend],
	);

	return (
		<Toolbar className="bg-inverse-primary-bg">
			<div className="flex items-end gap-1 w-full">
				<StyledTextareaWrapper className="flex w-full px-2 py-3.5" style={{ alignSelf: "center" }}>
					<AutogrowTextarea
						autoFocus
						minRows={1}
						onInput={onInput}
						onKeyDown={onEnter}
						placeholder={placeholder}
					/>
				</StyledTextareaWrapper>
				<PromptList onClick={onClick} />
				<AiToolbarButton
					className="flex-shrink-0"
					disabled={disabled}
					icon="arrow-up"
					onClick={onClickSend}
					tooltipText={t("send")}
				/>
			</div>
		</Toolbar>
	);
});
