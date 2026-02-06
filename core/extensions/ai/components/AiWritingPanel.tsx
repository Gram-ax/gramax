import { useApi } from "@core-ui/hooks/useApi";
import styled from "@emotion/styled";
import { AiToolbarButton } from "@ext/ai/components/Helpers/AiToolbarButton";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@ui-kit/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { Toolbar, ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import {
	type ChangeEvent,
	type Dispatch,
	type KeyboardEvent,
	memo,
	type SetStateAction,
	useCallback,
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

	const { call: getPrompts } = useApi<ProviderItemProps[]>({
		url: (api) => api.getArticleListInGramaxDir("prompt"),
		onDone: (data) => setList(data),
	});

	const onOpenChange = (open: boolean) => {
		if (open) getPrompts();
	};

	return (
		<Popover onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<ToolbarToggleButton className="flex-shrink-0" focusable tooltipText={t("ai.ai-prompts")}>
					<ToolbarIcon icon="list" />
				</ToolbarToggleButton>
			</PopoverTrigger>
			<PopoverContent className="p-0 bg-transparent border-none" side="top">
				<Command>
					{list.length > 0 && <CommandInput placeholder={t("ai.search-prompts")} />}
					<CommandList>
						<CommandEmpty>{t("ai.no-prompts")}</CommandEmpty>
						{list.map((prompt, idx) => (
							<CommandItem
								key={prompt.id}
								onSelect={() => onClick(prompt.title)}
								value={prompt.title + idx}
							>
								{prompt.title}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
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
