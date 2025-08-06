import GoToArticle from "@components/Actions/GoToArticle";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { Router } from "@core/Api/Router";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Link } from "@ext/properties/logic/CatalogLinksProvider";
import DropdownButton from "@ext/wordExport/components/DropdownButton";
import { useRef, useState } from "react";

const Loader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 8em !important;
`;

const LinkItem = styled.div`
	width: 100%;
	color: var(--color-link) !important;
	font-size: 0.75rem !important;
	overflow-x: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const LinkItemWrapper = styled.div`
	max-width: 20rem;

	> span:first-of-type {
		width: 100%;
	}
`;

const Title = styled.span`
	display: block;
	width: 100%;
	padding: 0.46rem 0.9rem 0 0.9rem;
	text-transform: uppercase;
	color: var(--color-loader);
	font-weight: 450;
	font-size: 0.75rem;
	cursor: default;
`;

const LinksContainer = ({ title, links, router }: { title: string; links: Link[]; router: Router }) => {
	const handleLinkClick = (pathname: string) => {
		router.pushPath(pathname);
	};

	return (
		<>
			<Title>{title}</Title>
			{links.map((link) => (
				<LinkItemWrapper key={link.pathname} onClickCapture={() => handleLinkClick(link.pathname)}>
					<GoToArticle href={link.pathname} trigger={<LinkItem>{link.title}</LinkItem>} />
				</LinkItemWrapper>
			))}
		</>
	);
};

const ArticleLinks = ({ itemRefPath }: { itemRefPath: string }) => {
	const [backlinks, setBacklinks] = useState<Link[]>([]);
	const [links, setLinks] = useState<Link[]>([]);
	const router = useRouter();

	const [isApiRequest, setIsApiRequest] = useState(true);
	const ref = useRef<HTMLDivElement>(null);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const getBacklinks = async () => {
		setIsApiRequest(true);
		const url = apiUrlCreator.getArticleBacklinks(itemRefPath);
		const res = await FetchService.fetch<Link[]>(url);

		if (!res.ok) return setIsApiRequest(false);
		const backlinks = await res.json();

		setBacklinks(backlinks);
		setIsApiRequest(false);
	};

	const getLinks = async () => {
		setIsApiRequest(true);
		const url = apiUrlCreator.getArticleLinks(itemRefPath);
		const res = await FetchService.fetch<Link[]>(url);

		if (!res.ok) return setIsApiRequest(false);
		const links = await res.json();

		setLinks(links);
		setIsApiRequest(false);
	};

	return (
		<PopupMenuLayout
			appendTo={() => ref.current}
			offset={[10, -5]}
			className="wrapper"
			placement="right-start"
			openTrigger="mouseenter focus"
			hideOnClick={false}
			onClose={() => {
				setBacklinks([]);
				setLinks([]);
				setIsApiRequest(true);
			}}
			onOpen={() => {
				getBacklinks();
				getLinks();
			}}
			trigger={<DropdownButton ref={ref} iconCode="waypoints" text={t("article.links.name")} />}
		>
			{!isApiRequest && !backlinks.length && !links.length ? (
				<ButtonLink text={t("article.links.no-links")} />
			) : null}
			{isApiRequest && (
				<Loader>
					<ButtonLink text={t("loading")} />
					<SpinnerLoader width={14} height={14} />
				</Loader>
			)}
			{!isApiRequest && (
				<>
					{backlinks?.length ? (
						<LinksContainer title={t("article.links.backlinks")} links={backlinks} router={router} />
					) : null}
					{links?.length ? (
						<LinksContainer title={t("article.links.links")} links={links} router={router} />
					) : null}
				</>
			)}
		</PopupMenuLayout>
	);
};

export default ArticleLinks;
