import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { Router } from "@core/Api/Router";
import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Link } from "@ext/properties/logic/CatalogLinksProvider";
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { useState } from "react";

const LinkItem = styled.div`
	width: 100%;
	max-width: 20rem;
	color: var(--color-link);
	overflow-x: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const LinksContainer = ({ links, router }: { links: Link[]; router: Router }) => {
	const handleLinkClick = (pathname: string) => {
		router.pushPath(pathname);
	};

	return links.map((link) => (
		<DropdownMenuItem key={link.pathname} onSelect={() => handleLinkClick(link.pathname)}>
			<LinkItem>{link.title}</LinkItem>
		</DropdownMenuItem>
	));
};

const DropdownLink = ({ fetch, title, router }: { fetch: () => Promise<Link[]>; title: string; router: Router }) => {
	const [isApiRequest, setIsApiRequest] = useState(true);
	const [links, setLinks] = useState<Link[]>([]);

	const onOpenChange = (open: boolean) => {
		if (open)
			fetch().then((links) => {
				setLinks(links);
				setIsApiRequest(false);
			});
		else {
			setLinks([]);
			setIsApiRequest(true);
		}
	};

	return (
		<DropdownMenuSub onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger>{title}</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{!isApiRequest && !links.length ? (
					<DropdownMenuItem disabled>{t("article.links.no-links")}</DropdownMenuItem>
				) : null}
				{isApiRequest && (
					<DropdownMenuItem>
						<SpinnerLoader height={14} width={14} />
						{t("loading")}
					</DropdownMenuItem>
				)}
				{!isApiRequest && links?.length ? <LinksContainer links={links} router={router} /> : null}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

const ArticleLinks = ({ itemRefPath }: { itemRefPath: string }) => {
	const router = useRouter();

	const apiUrlCreator = ApiUrlCreatorService.value;

	const getBacklinks = async () => {
		const url = apiUrlCreator.getArticleBacklinks(itemRefPath);
		const res = await FetchService.fetch<Link[]>(url);

		if (!res.ok) return [];
		return await res.json();
	};

	const getLinks = async () => {
		const url = apiUrlCreator.getArticleLinks(itemRefPath);
		const res = await FetchService.fetch<Link[]>(url);

		if (!res.ok) return [];
		return await res.json();
	};

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<Icon code="waypoints" />
				{t("article.links.name")}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownLink fetch={getBacklinks} router={router} title={t("article.links.backlinks")} />
				<DropdownLink fetch={getLinks} router={router} title={t("article.links.links")} />
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default ArticleLinks;
