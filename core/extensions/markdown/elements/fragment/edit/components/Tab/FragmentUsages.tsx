import GoToArticle from "@components/Actions/GoToArticle";
import { highlightFragmentUsage } from "@components/Article/SearchHandler/ArticleSearchFragmentHander";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
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

export interface FragmentUsagesItemProps {
	pathname: string;
	title: string;
}

interface FragmentUsagesProps {
	fragmentId: string;
	trigger: JSX.Element;
	isSubmenu?: boolean;
}

const FragmentUsages = ({ fragmentId, trigger, isSubmenu }: FragmentUsagesProps) => {
	const [list, setList] = useState<FragmentUsagesItemProps[]>([]);
	const [isApiRequest, setIsApiRequest] = useState(false);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const fetchFragmentUsages = async () => {
		setIsApiRequest(true);
		const url = apiUrlCreator.getArticlesWithFragment(fragmentId);
		const res = await FetchService.fetch(url);

		if (!res.ok) return setIsApiRequest(false);
		const fragments = await res.json();

		setList(fragments);
		setIsApiRequest(false);
	};

	const onOpenChange = (value: boolean) => {
		if (value) void fetchFragmentUsages();
		else setList([]);
	};

	const onClick = (pathname: string) => {
		FragmentService.closeItem();

		const currentPath = decodeURIComponent(router.path).replace(/^\//, "");
		const usagePath = decodeURIComponent(pathname).replace(/^\//, "");
		if (currentPath === usagePath) void highlightFragmentUsage(fragmentId);
	};

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
						{list.map((item) => (
							<DropdownMenuItem key={item.pathname}>
								<GoToArticle
									href={item.pathname}
									onClick={() => onClick(item.pathname)}
									query={{ fragmentUsage: fragmentId }}
									trigger={item.title}
								/>
							</DropdownMenuItem>
						))}
						{!list.length && <DropdownMenuItem disabled>{t("fragment-no-usages")}</DropdownMenuItem>}
					</>
				)}
			</MenuContent>
		</Menu>
	);
};

export default FragmentUsages;
