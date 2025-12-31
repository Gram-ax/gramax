import { useState, useRef, KeyboardEvent, useCallback, memo, Dispatch, SetStateAction, ChangeEvent } from "react";
import t from "@ext/localization/locale/translate";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@ui-kit/Command";
import { useApi } from "@core-ui/hooks/useApi";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { Toolbar, ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import styled from "@emotion/styled";
import { AiToolbarButton } from "@ext/ai/components/Helpers/AiToolbarButton";

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
				<ToolbarToggleButton tooltipText={t("ai.ai-prompts")} className="flex-shrink-0" focusable>
					<ToolbarIcon icon="list" />
				</ToolbarToggleButton>
			</PopoverTrigger>
			<PopoverContent side="top" className="p-0 bg-transparent border-none">
				<Command>
					{list.length > 0 && <CommandInput placeholder={t("ai.search-prompts")} />}
					<CommandList>
						<CommandEmpty>{t("ai.no-prompts")}</CommandEmpty>
						{list.map((prompt, idx) => (
							<CommandItem
								key={prompt.id}
								value={prompt.title + idx}
								onSelect={() => onClick(prompt.title)}
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
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const onClick = useCallback(
		(command: string) => {
			onSubmit(command);
			closeHandler?.();
		},
		[onSubmit, closeHandler],
	);

	const onClickSend = useCallback(() => {
		if (!inputRef.current) return;
		onClick(inputRef.current.value);
	}, [onClick]);

	const onInput = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
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
						ref={inputRef}
						placeholder={placeholder}
						onKeyDown={onEnter}
						onInput={onInput}
					/>
				</StyledTextareaWrapper>
				<PromptList onClick={onClick} />
				<AiToolbarButton
					tooltipText={t("send")}
					icon="arrow-up"
					className="flex-shrink-0"
					disabled={disabled}
					onClick={onClickSend}
				/>
			</div>
		</Toolbar>
	);
});
