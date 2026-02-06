import GoToArticle from "@components/Actions/GoToArticle";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { useState } from "react";

export interface SnippetUsagesItemProps {
	pathname: string;
	title: string;
}

interface SnippetUsagesProps {
	snippetId: string;
	trigger: JSX.Element;
	isSubmenu?: boolean;
}

const SnippetUsages = ({ snippetId, trigger, isSubmenu }: SnippetUsagesProps) => {
	const [list, setList] = useState<SnippetUsagesItemProps[]>([]);
	const [isApiRequest, setIsApiRequest] = useState(false);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchSnippetUsages = async () => {
		setIsApiRequest(true);
		const url = apiUrlCreator.getArticlesWithSnippet(snippetId);
		const res = await FetchService.fetch(url);

		if (!res.ok) return setIsApiRequest(false);
		const snippets = await res.json();

		setList(snippets);
		setIsApiRequest(false);
	};

	const onOpenChange = (value: boolean) => {
		if (value) void fetchSnippetUsages();
		else setList([]);
	};

	const onClick = () => SnippetService.closeItem();

	const Menu = isSubmenu ? DropdownMenuSub : DropdownMenu;
	const MenuContent = isSubmenu ? DropdownMenuSubContent : DropdownMenuContent;
	const MenuTrigger = isSubmenu ? DropdownMenuSubTrigger : DropdownMenuTrigger;

	return (
		<Menu onOpenChange={onOpenChange}>
			<MenuTrigger asChild={!isSubmenu}>{trigger}</MenuTrigger>
			<MenuContent>
				{isApiRequest ? (
					<>
						{[
							<DropdownMenuItem key={0}>
								<SpinnerLoader height={16} width={16} />
								{t("loading")}
							</DropdownMenuItem>,
						]}
					</>
				) : (
					<>
						{list.map((item, idx) => (
							<DropdownMenuItem key={idx}>
								<GoToArticle href={item.pathname} onClick={onClick} trigger={item.title} />
							</DropdownMenuItem>
						))}
						{!list.length && <DropdownMenuItem disabled>{t("snippet-no-usages")}</DropdownMenuItem>}
					</>
				)}
			</MenuContent>
		</Menu>
	);
};

export default SnippetUsages;
