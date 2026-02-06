import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";
import { useMediaQuery } from "@mui/material";
import { Editor } from "@tiptap/core";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@ui-kit/Command";
import { DropdownMenuSub, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { MenuItemIconButton } from "@ui-kit/MenuItem";
import { ToolbarDropdownMenuSubContent } from "@ui-kit/Toolbar";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

interface SnippetsButtonProps {
	editor: Editor;
}

const SnippetsButton = ({ editor }: SnippetsButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [snippetsList, setSnippetsList] = useState<ProviderItemProps[]>([]);
	const [listHeight, setListHeight] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const { call: getSnippets, status } = useApi<ProviderItemProps[]>({
		url: (api) => api.getArticleListInGramaxDir("snippet"),
		onDone: (data) => setSnippetsList(data),
		parse: "json",
	});

	useLayoutEffect(() => {
		if (status === RequestStatus.Ready && listRef.current) {
			const height = listRef.current.offsetHeight;
			setListHeight(`${height}px`);
		}
	}, [status]);

	const onItemSelect = useCallback(
		async (snippet: ProviderItemProps) => {
			const res = await FetchService.fetch<SnippetRenderData>(apiUrlCreator.getSnippetRenderData(snippet.id));
			if (!res.ok) return;

			const data = await res.json();
			editor.chain().setSnippet(data).focus(editor.state.selection.anchor).run();
		},
		[editor, apiUrlCreator],
	);

	const { disabled } = ButtonStateService.useCurrentAction({ action: "snippet" });

	const openSnippetTab = useCallback(() => {
		NavigationTabsService.setTop(LeftNavigationTab.Snippets);
	}, []);

	const onEditClick = useCallback((snippet: ProviderItemProps) => {
		SnippetService.openItem(snippet);
	}, []);

	const addNewSnippet = useCallback(async () => {
		openSnippetTab();
		const newSnippet = await SnippetService.addNewSnippet(apiUrlCreator);
		SnippetService.openItem(newSnippet);
	}, [apiUrlCreator]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) setListHeight(null);
			if (open && status !== RequestStatus.Loading) getSnippets();
		},
		[getSnippets, status],
	);

	return (
		<DropdownMenuSub onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger disabled={disabled}>
				<div className="flex items-center gap-2" data-qa="qa-snippets">
					<Icon icon="sticky-note" />
					{t("snippets")}
				</div>
			</DropdownMenuSubTrigger>
			<ToolbarDropdownMenuSubContent
				alignOffset={!isMobile ? -18 : 0}
				className={cn(!isMobile && "px-3 py-3 pl-2")}
				contentClassName="p-0 lg:shadow-hard-base"
				ref={listRef}
				sideOffset={!isMobile ? 2 : 6}
				style={{
					maxWidth: "calc(min(11rem, var(--radix-dropdown-menu-content-available-width, 100%)))",
					height: listHeight,
					maxHeight: listHeight,
					overflowY: "auto",
				}}
			>
				<Command>
					{snippetsList?.length > 5 && (
						<CommandInput autoFocus placeholder={`${t("find2")} ${t("snippet").toLowerCase()}`} />
					)}
					<CommandList>
						<CommandEmpty>{t("list.no-results-found")}</CommandEmpty>
						<CommandGroup>
							{status === RequestStatus.Ready ? (
								snippetsList.map((snippet) => (
									<CommandItem key={snippet.id} onSelect={() => void onItemSelect(snippet)}>
										<div className="flex flex-row items-center gap-2 overflow-hidden w-full">
											<div className="truncate whitespace-nowrap">{snippet.title}</div>
											<MenuItemIconButton
												className="ml-auto flex-shrink-0"
												icon="pen"
												onClick={() => onEditClick(snippet)}
											/>
										</div>
									</CommandItem>
								))
							) : (
								<CommandItem disabled>
									<div className="flex items-center gap-2">
										<Loader size="sm" />
										{t("loading")}
									</div>
								</CommandItem>
							)}
							{snippetsList.length > 0 && <CommandSeparator className="mt-1 mb-1" />}
							<CommandItem onSelect={addNewSnippet}>
								<div className="flex items-center gap-2">
									<Icon icon="plus" />
									{t("add")}
								</div>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</ToolbarDropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default SnippetsButton;
