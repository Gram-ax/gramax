import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import PageDataContext from "@core/Context/PageDataContext";
import { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import Header from "@ext/markdown/elements/heading/render/component/Header";
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
			closeHandler();
		}
	}, [isVisible]);

	const fetchData = useCallback(async () => {
		const combinedResourcePath = getMark()?.attrs?.resourcePath || resourcePath;
		if (!combinedResourcePath) return;

		const url = apiUrlCreator.getArticleContentByRelativePath(combinedResourcePath);
		if (!url) return;

		const res = await FetchService.fetch<dataType>(url);
		if (!res || !res.ok) return;

		const data = await res.json();
		setData(data);
	}, [apiUrlCreator, getMark, resourcePath]);

	const clearHandler = useCallback(() => {
		debounceClose.cancel();
		addClosedClass.cancel();
		setCanClose(true);
	}, []);

	useEffect(() => {
		const debounceOpen = setTimeout(() => setIsVisible(true), 500);
		const fetchDataTimeout = setTimeout(() => fetchData(), 450);

		return () => {
			clearTimeout(debounceOpen);
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
		const handleClick = () => {
			if (!isVisible) return close();

			closeComponent.start();
			setCanClose(false);
		};

		element.addEventListener("mouseleave", handleMouseLeave);
		element.addEventListener("mouseenter", handleMouseEnter);
		element.addEventListener("click", handleClick);

		return () => {
			element.removeEventListener("mouseleave", handleMouseLeave);
			element.removeEventListener("mouseenter", handleMouseEnter);
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
			<PageDataContextService.Provider value={pageDataContext}>
				<CatalogPropsService.Provider value={catalogProps}>
					<ArticlePropsService.Provider value={data.articleProps}>
						<>{children}</>
					</ArticlePropsService.Provider>
				</CatalogPropsService.Provider>
			</PageDataContextService.Provider>
		</ApiUrlCreatorService.Provider>
	);
};

const TooltipContent = (props: TooltipContent) => {
	const { data, start, clear, close, className, position } = props;
	const ref = useRef(null);
	const [location] = useLocation();
	const test = useRef(location);

	useEffect(() => {
		if (test.current !== location) close();
	}, [location]);

	useEffect(() => {
		const handleMouseLeave = () => start();
		const handleMouseEnter = () => clear();

		if (ref.current) {
			ref.current.addEventListener("mouseleave", handleMouseLeave);
			ref.current.addEventListener("mouseenter", handleMouseEnter);
		}

		return () => {
			if (ref.current) {
				ref.current.removeEventListener("mouseleave", handleMouseLeave);
				ref.current.removeEventListener("mouseenter", handleMouseEnter);
			}
		};
	}, [start, clear]);

	if (!data) return null;

	return (
		<div ref={ref} className={position === "top" ? "tooltip-top" : "tooltip-bottom"}>
			<div className={className}>
				<div className={classNames("article", {}, ["tooltip-size"])}>
					<Header
						level={1}
						className={classNames("article-title", {}, ["link-popup-title"])}
						copyLinkIcon={false}
					>
						{data.title}
					</Header>
					<MinimizedArticleStyle>
						<div className={classNames("article-body", {}, ["popup-article"])}>
							{Renderer(data.content, { components: getComponents() })}
						</div>
					</MinimizedArticleStyle>
				</div>
			</div>
		</div>
	);
};

const MinimizedArticleStyle = styled(({ className, children }: { className?: string; children: ReactNode }) => {
	return <div className={className}>{children}</div>;
})`
	h2 {
		font-size: 1.2em !important;
	}

	h3 {
		font-size: 1.1em !important;
	}

	h4,
	h5,
	h6 {
		font-size: 1em !important;
	}

	h2,
	h3,
	h4,
	h5,
	h6 {
		margin-top: 0.5em !important;
		margin-bottom: 0.25em !important;
	}

	blockquote {
		margin: 0.575em 0 !important;
	}

	table {
		padding: 0.5rem 0 !important;
	}

	.admonition {
		margin: 0.5em 0 !important;
	}

	img {
		margin: 0.5em auto !important;
		pointer-events: none !important;
	}

	ol > li::before {
		top: 0.23em !important;
		width: 18px !important;
		padding: 4px 0 !important;
	}

	pre,
	code,
	.diagram-background {
		margin: 1em 0 !important;
	}

	ol,
	ul,
	p {
		margin: 0 0 0.35em !important;
		line-height: 1.5em !important;
	}
`;

export default styled(ArticleLinkTooltip)`
	&.tooltip-wrapper {
		padding: 0 !important;
		font-size: 14px !important;
		line-height: 1.4 !important;
		background: transparent !important;
		color: var(--color-article-text) !important;
		background: var(--color-article-bg) !important;
	}

	&.tooltip-open {
		box-shadow: var(--menu-tooltip-shadow);
		animation: TooltipAppend 50ms linear forwards;
		border-radius: var(--radius-normal) !important;
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
		overflow: scroll;
	}

	.tooltip-top {
		margin-bottom: -0.75rem;
		padding-bottom: 0.75rem;
	}

	.tooltip-bottom {
		margin-top: -0.75rem;
		padding-top: 0.75rem;
	}

	.tooltip-article {
		overflow: hidden;
		padding: 0 !important;
		border-radius: var(--radius-normal) !important;
	}

	.link-popup-title {
		margin-top: 0 !important;
		font-size: 1.3em !important;
		margin-bottom: 0.5rem !important;
	}
`;
