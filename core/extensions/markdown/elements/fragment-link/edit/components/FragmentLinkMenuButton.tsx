import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import styled from "@emotion/styled";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@ui-kit/Command";
import { Loader } from "@ui-kit/Loader";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback, useRef, useState } from "react";

const StyledCommand = styled(Command)`
	width: 18.75rem;
	max-height: min(18.75rem, 60vh);
`;

interface FragmentLinkMenuButtonProps {
	editor: Editor;
}

const FragmentLinkMenuButton = ({ editor }: FragmentLinkMenuButtonProps) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "fragment-link" });
	const [isOpen, setIsOpen] = useState(false);
	const [fragmentsList, setFragmentsList] = useState<ProviderItemProps[]>([]);
	const portalContainerRef = useRef<HTMLDivElement>(null);

	const { call: getFragments, status } = useApi<ProviderItemProps[]>({
		url: (api) => api.getArticleListInGramaxDir("fragment"),
		onDone: (data) => setFragmentsList(data),
		parse: "json",
	});

	const onTriggerClick = useCallback(() => {
		if (disabled) return;
		if (isActive) {
			editor.chain().focus().unsetFragmentLink().run();
			return;
		}
		if (status !== RequestStatus.Loading) getFragments();
		setIsOpen(true);
	}, [disabled, isActive, editor, getFragments, status]);

	const onItemSelect = useCallback(
		(fragment: ProviderItemProps) => {
			editor.chain().focus().setFragmentLink({ id: fragment.id }).run();
			setIsOpen(false);
		},
		[editor],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (isActive) return;
			setIsOpen(open);
		},
		[isActive],
	);

	const onAutoCloseFocus = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

	return (
		<div ref={portalContainerRef}>
			<Popover onOpenChange={onOpenChange} open={isOpen}>
				<PopoverTrigger asChild>
					<ToolbarToggleButton
						active={isActive}
						data-qa="fragment-link-button"
						disabled={disabled}
						onClick={onTriggerClick}
						tooltipText={t("fragment-link")}
					>
						<ToolbarIcon icon="square-dashed-bottom" />
					</ToolbarToggleButton>
				</PopoverTrigger>
				<PopoverContent
					alignOffset={-18}
					className="p-0 !bg-transparent !border-none !shadow-none"
					onCloseAutoFocus={onAutoCloseFocus}
					portalContainer={portalContainerRef.current}
					side="top"
					sideOffset={0}
					style={{ boxShadow: "none" }}
				>
					<ComponentVariantProvider variant="inverse">
						<StyledCommand className="rounded-lg lg:shadow-hard-base" shouldFilter={true}>
							<CommandInput
								autoFocus
								className="text-xs"
								placeholder={`${t("find2")} ${t("fragment").toLowerCase()}`}
							/>
							<CommandList>
								<CommandEmpty>{t("list.no-results-found")}</CommandEmpty>
								<CommandGroup className="overflow-y-auto text-xs" style={{ maxHeight: "11rem" }}>
									{status === RequestStatus.Ready ? (
										fragmentsList.map((fragment) => (
											<CommandItem
												className="px-2 py-1"
												key={fragment.id}
												onSelect={() => onItemSelect(fragment)}
											>
												<span className="text-xs truncate">{fragment.title}</span>
											</CommandItem>
										))
									) : (
										<CommandItem className="px-2 py-1" disabled>
											<div className="flex items-center gap-2">
												<Loader size="sm" />
												<span className="text-xs">{t("loading")}</span>
											</div>
										</CommandItem>
									)}
								</CommandGroup>
							</CommandList>
						</StyledCommand>
					</ComponentVariantProvider>
				</PopoverContent>
			</Popover>
		</div>
	);
};

export default FragmentLinkMenuButton;
