import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import type { FragmentRenderData } from "@ext/markdown/elements/fragment/edit/model/types";
import type { Editor } from "@tiptap/core";
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
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useCallback, useState } from "react";

interface FragmentsButtonProps {
	editor: Editor;
}

const FragmentsButton = ({ editor }: FragmentsButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [fragmentsList, setFragmentsList] = useState<ProviderItemProps[]>([]);
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const { call: getFragments, status } = useApi<ProviderItemProps[]>({
		url: (api) => api.getArticleListInGramaxDir("fragment"),
		onDone: (data) => setFragmentsList(data),
		parse: "json",
	});

	const onItemSelect = useCallback(
		async (fragment: ProviderItemProps) => {
			const res = await FetchService.fetch<FragmentRenderData>(apiUrlCreator.getFragmentRenderData(fragment.id));
			if (!res.ok) return;

			const data = await res.json();
			editor.chain().setFragment(data).focus(editor.state.selection.anchor).run();
		},
		[editor, apiUrlCreator],
	);

	const { disabled } = ButtonStateService.useCurrentAction({ action: "fragment" });

	const openFragmentTab = useCallback(() => {
		NavigationTabsService.setTop(LeftNavigationTab.Fragments);
	}, []);

	const onEditClick = useCallback((fragment: ProviderItemProps) => {
		FragmentService.openItem(fragment);
	}, []);

	const addNewFragment = useCallback(async () => {
		openFragmentTab();
		const newFragment = await FragmentService.addNewFragment(apiUrlCreator);
		FragmentService.openItem(newFragment);
	}, [apiUrlCreator, openFragmentTab]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (open && status !== RequestStatus.Loading) getFragments();
		},
		[getFragments, status],
	);

	return (
		<DropdownMenuSub onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger disabled={disabled}>
				<div className="flex items-center gap-2" data-qa="qa-fragments">
					<Icon icon="square-dashed-bottom" />
					{t("fragments")}
				</div>
			</DropdownMenuSubTrigger>
			<ToolbarDropdownMenuSubContent
				alignOffset={!isMobile ? -18 : 0}
				className={cn(!isMobile && "px-3 py-3 pl-2")}
				contentClassName="p-0 lg:shadow-hard-base"
				sideOffset={!isMobile ? 2 : 6}
				style={{
					maxWidth: "calc(min(14rem, var(--radix-dropdown-menu-content-available-width, 100%)))",
				}}
			>
				<Command>
					{fragmentsList?.length > 5 && (
						<CommandInput autoFocus placeholder={`${t("find2")} ${t("fragment").toLowerCase()}`} />
					)}
					<CommandList>
						<CommandEmpty>{t("list.no-results-found")}</CommandEmpty>
						<CommandGroup>
							{status === RequestStatus.Ready ? (
								fragmentsList.map((fragment) => (
									<CommandItem key={fragment.id} onSelect={() => void onItemSelect(fragment)}>
										<div className="flex flex-row items-center gap-2 overflow-hidden w-full">
											<div className="min-w-0 flex-1">
												<TextOverflowTooltip className="block w-full">
													{fragment.title}
												</TextOverflowTooltip>
											</div>
											<MenuItemIconButton
												className="ml-auto flex-shrink-0 hover:!bg-white [&:hover_svg]:!text-black"
												icon="pen"
												onClick={() => onEditClick(fragment)}
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
						</CommandGroup>
					</CommandList>
					{fragmentsList.length > 0 && <CommandSeparator className="mt-1 mb-1" />}
					<CommandGroup>
						<CommandItem onSelect={addNewFragment}>
							<div className="flex items-center gap-2">
								<Icon icon="plus" />
								{t("add")}
							</div>
						</CommandItem>
					</CommandGroup>
				</Command>
			</ToolbarDropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default FragmentsButton;
