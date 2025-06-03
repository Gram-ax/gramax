import GoToArticle from "@components/Actions/GoToArticle";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { MouseEvent, useRef, useState } from "react";
import { Props } from "tippy.js";

interface SnippetUsagesProps {
	pathname: string;
	title: string;
}

interface ComponentProps {
	snippetId: string;
	trigger: JSX.Element;
	openTrigger?: string;
	placement?: Props["placement"];
	offset?: Props["offset"];
}

const Loader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 8em !important;
`;

const SnippetUsages = ({ snippetId, trigger, openTrigger = "click", placement = "right-end", offset = [0, -5] }: ComponentProps) => {
	const [list, setList] = useState<SnippetUsagesProps[]>([]);
	const [isApiRequest, setIsApiRequest] = useState(false);

	const ref = useRef<HTMLDivElement>(null);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchTemplateItems = async () => {
		setIsApiRequest(true);
		const url = apiUrlCreator.getArticlesWithSnippet(snippetId);
		const res = await FetchService.fetch(url);

		if (!res.ok) return setIsApiRequest(false);
		const snippets = await res.json();

		setList(snippets);
		setIsApiRequest(false);
	};

	const onClick = (e: MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
	};

	const onLinkClick = (e: MouseEvent) => {
		e.stopPropagation();
	};

	return (
		<PopupMenuLayout
			offset={offset}
			appendTo={() => ref.current}
			placement={placement}
			className="wrapper"
			openTrigger={openTrigger}
			onOpen={() => {
				fetchTemplateItems();
			}}
			trigger={
				<span ref={ref} onClick={onClick}>
					{trigger}
				</span>
			}
		>
			{isApiRequest ? (
				<>
					{[...Array(3)].map((_, index) => (
						<Loader key={index}>
							<ButtonLink text={t("loading")} />
							<SpinnerLoader width={14} height={14} />
						</Loader>
					))}
				</>
			) : (
				<>
					{list.map((item, idx) => (
						<GoToArticle
							key={idx}
							href={item.pathname}
							trigger={
								<div
									className="popup-button"
									style={{ color: "var(--color-link)", fontSize: "0.75rem" }}
									onClick={onLinkClick}
								>
									{item.title}
								</div>
							}
						/>
					))}
					{!list.length && (
						<span className="popup-button" onClick={onClick}>
							{t("snippet-no-usages")}
						</span>
					)}
				</>
			)}
		</PopupMenuLayout>
	);
};

export default SnippetUsages;
