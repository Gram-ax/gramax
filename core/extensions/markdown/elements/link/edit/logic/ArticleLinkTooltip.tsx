import MiniArticle from "@components/Article/MiniArticle";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import PageDataContext from "@core/Context/PageDataContext";
import { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { Mark } from "@tiptap/pm/model";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

type dataType = {
	path: string;
	title: string;
	content: RenderableTreeNodes;
	articleProps: ClientArticleProps;
};

type TooltipContent = {
	data: dataType;
	start: () => void;
	clear: () => void;
	close: () => void;
	position: string;
	className?: string;
	hash?: string;
};

type TooltipProviderProps = {
	data: dataType;
	children: ReactNode;
	apiUrlCreator: ApiUrlCreator;
	pageDataContext: PageDataContext;
	catalogProps: ClientCatalogProps;
};

export interface LinkTooltipProps extends Omit<TooltipProviderProps, "children" | "data"> {
	closeHandler: () => void;
	openAfter: () => void;
	className?: string;
	element: HTMLElement;
	resourcePath?: string;
	getMark: () => Mark | undefined;
}

const ArticleLinkTooltip = (props: LinkTooltipProps) => {
	const { closeHandler, element, openAfter, apiUrlCreator, getMark, resourcePath, className, ...otherProps } = props;
	const [isVisible, setIsVisible] = useState(false);
	const [canClose, setCanClose] = useState(true);
	const [data, setData] = useState<dataType>(null);
	const [hash, setHash] = useState<string>(null);
	const [elementOnMount] = useState(element);
	const [tooltipPlace, setTooltipPlace] = useState("top");

	const debounceClose = useDebounce(closeHandler, 200, canClose);
	const addClosedClass = useDebounce(() => setCanClose(false), 150);
	const closeComponent = useDebounce(closeHandler, 80);

	const close = useCallback(() => {
		if (isVisible) {
			debounceClose.start();
			addClosedClass.start();
		} else {
			openDebounce.cancel();
			closeHandler();
		}
	}, [isVisible]);

	const openDebounce = useDebounce(() => setIsVisible(true), 500, true);

	const fetchData = useCallback(async () => {
		const mark = getMark();
		const combinedResourcePath = mark?.attrs?.resourcePath || resourcePath;
		if (!combinedResourcePath) return;

		const url = apiUrlCreator.getArticleContentByRelativePath(combinedResourcePath);
		if (!url) return;

		const res = await FetchService.fetch<dataType>(url);
		if (!res || !res.ok) return;

		const data = await res.json();
		if (mark?.attrs?.hash && mark.attrs?.hash !== hash) setHash(mark.attrs.hash);

		setData(data);
	}, [apiUrlCreator, getMark, resourcePath]);

	const clearHandler = useCallback(() => {
		debounceClose.cancel();
		addClosedClass.cancel();
		openDebounce.cancel();
		setCanClose(true);
	}, []);

	useEffect(() => {
		const fetchDataTimeout = setTimeout(() => fetchData(), 450);

		return () => {
			clearTimeout(fetchDataTimeout);
		};
	}, [fetchData]);

	useEffect(() => {
		if (elementOnMount !== element) close();

		return () => {
			if (elementOnMount !== element) openAfter();
		};
	}, [element]);

	useEffect(() => {
		const handleMouseLeave = () => close();
		const handleMouseEnter = () => clearHandler();
		const handleMouseMove = () => openDebounce.start();
		const handleClick = () => {
			if (!isVisible) return close();

			closeComponent.start();
			setCanClose(false);
		};

		element.addEventListener("mouseleave", handleMouseLeave);
		element.addEventListener("mousemove", handleMouseMove);
		element.addEventListener("mouseenter", handleMouseEnter);
		element.addEventListener("click", handleClick);

		return () => {
			element.removeEventListener("mouseleave", handleMouseLeave);
			element.removeEventListener("mouseenter", handleMouseEnter);
			element.removeEventListener("mousemove", handleMouseMove);
			element.removeEventListener("click", handleClick);
		};
	}, [isVisible, close, clearHandler]);

	const mods = {
		"tooltip-open": canClose,
		"tooltip-closed": !canClose,
	};

	return (
		<Tooltip
			visible={isVisible}
			arrow={false}
			interactive={true}
			hideOnClick={undefined}
			setPlaceCallback={(place) => setTooltipPlace(place)}
			contentClassName={classNames("tooltip-wrapper", {}, [className])}
			content={
				<TooltipProvider data={data} apiUrlCreator={apiUrlCreator} {...otherProps}>
					<TooltipContent
						className={classNames("tooltip-article", mods, [className])}
						start={close}
						position={tooltipPlace}
						clear={clearHandler}
						close={closeHandler}
						data={data}
						hash={hash}
					/>
				</TooltipProvider>
			}
		>
			<div style={{ height: "1.25rem" }} />
		</Tooltip>
	);
};

const TooltipProvider = (props: TooltipProviderProps) => {
	const { pageDataContext, catalogProps, apiUrlCreator, data, children } = props;

	if (!data) return null;

	return (
		<ApiUrlCreatorService.Provider value={apiUrlCreator.fromNewArticlePath(data.path)}>
			<OnLoadResourceService.Provider>
				<PageDataContextService.Provider value={pageDataContext}>
					<CatalogPropsService.Provider value={catalogProps}>
						<ArticleRefService.Provider>
							<>{children}</>
						</ArticleRefService.Provider>
					</CatalogPropsService.Provider>
				</PageDataContextService.Provider>
			</OnLoadResourceService.Provider>
		</ApiUrlCreatorService.Provider>
	);
};

const TooltipContent = (props: TooltipContent) => {
	const { data, start, clear, close, className, hash } = props;
	const articleRef = ArticleRefService.value;
	const [location] = useLocation();
	const test = useRef(location);

	useEffect(() => {
		if (test.current !== location) close();
	}, [location]);

	useEffect(() => {
		const handleMouseLeave = () => start();
		const handleMouseEnter = () => clear();

		if (articleRef.current) {
			articleRef.current.addEventListener("mouseleave", handleMouseLeave);
			articleRef.current.addEventListener("mouseenter", handleMouseEnter);
		}

		return () => {
			if (articleRef.current) {
				articleRef.current.removeEventListener("mouseleave", handleMouseLeave);
				articleRef.current.removeEventListener("mouseenter", handleMouseEnter);
			}
		};
	}, [start, clear]);

	if (!data) return null;

	useEffect(() => {
		if (!hash) return;
		const anchor = document.querySelector(`.tooltip-article [id="${hash.slice(1)}"]`);
		if (!anchor) return;

		anchor.scrollIntoView();
	}, [articleRef?.current]);

	return (
		<div ref={articleRef}>
			<div className={className}>
				<MiniArticle title={data.title} content={data.content} />
			</div>
		</div>
	);
};

export default styled(ArticleLinkTooltip)`
	&.tooltip-wrapper {
		padding: 0 !important;
		font-size: 14px !important;
		line-height: 1.4 !important;
		background: transparent !important;
		color: var(--color-article-text) !important;
	}

	&.tooltip-open {
		animation: TooltipAppend 50ms linear forwards;
	}

	&.tooltip-closed {
		animation: TooltipClosed 50ms linear forwards;
	}

	@keyframes TooltipAppend {
		from {
			opacity: 0.2;
			transform: translate(0, 5px);
		}

		to {
			opacity: 1;
			transform: translate(0, 0);
		}
	}

	@keyframes TooltipClosed {
		from {
			opacity: 1;
			transform: translate(0, 0);
		}

		to {
			opacity: 0.2;
			transform: translate(0, 5px);
		}
	}

	.tooltip-size {
		width: 400px;
		height: 250px;
		padding: 1rem;
		overflow-y: scroll;
		overflow-x: auto;
	}

	.tooltip-article {
		padding: 0 !important;
		box-shadow: var(--menu-tooltip-shadow);
		border-radius: var(--radius-x-large);
		overflow: hidden;
	}

	.link-popup-title {
		margin-top: 0 !important;
		font-size: 1.3em !important;
		margin-bottom: 0.5rem !important;
	}
`;
