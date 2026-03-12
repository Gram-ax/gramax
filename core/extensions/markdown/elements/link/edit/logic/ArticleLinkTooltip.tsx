import MiniArticle from "@components/Article/MiniArticle";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import type PageDataContext from "@core/Context/PageDataContext";
import type { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import safeDecode from "@core/utils/safeDecode";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { useApi } from "@core-ui/hooks/useApi";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { getHref } from "@ext/markdown/elements/link/edit/logic/getHref";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import type { Mark } from "@tiptap/pm/model";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

type dataType = {
	path: string;
	title: string;
	content: RenderableTreeNodes;
	articleProps: ClientArticleProps;
	error?: string;
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
	catalogProps: ClientCatalogProps;
	apiUrlCreator: ApiUrlCreator;
	pageDataContext: PageDataContext;
};

export interface LinkTooltipProps extends Omit<TooltipProviderProps, "children" | "data" | "catalogProps"> {
	closeHandler: () => void;
	className?: string;
	element: HTMLElement;
	resourcePath?: string;
	getMark: () => Mark | undefined;
	hash?: string;
	href?: string;
}

const ArticleLinkTooltip = (props: LinkTooltipProps) => {
	const {
		closeHandler,
		element,
		apiUrlCreator,
		getMark,
		resourcePath,
		className,
		hash: initialHash,
		href,
		...otherProps
	} = props;
	const [isVisible, setIsVisible] = useState(false);
	const [canClose, setCanClose] = useState(true);
	const [hash, setHash] = useState<string>(initialHash);
	const [catalogProps, setCatalogProps] = useState<ClientCatalogProps>(null);
	const [tooltipPlace, setTooltipPlace] = useState("top");

	const debounceClose = useDebounce(closeHandler, 200, canClose);
	const addClosedClass = useDebounce(() => setCanClose(false), 150);
	const closeComponent = useDebounce(closeHandler, 80);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
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

	const { call: fetchData, data } = useApi<dataType>({
		url: useMemo(() => {
			const mark = getMark();
			const combinedResourcePath = mark?.attrs?.resourcePath || resourcePath;
			const url = apiUrlCreator.getArticleContentByRelativePath(combinedResourcePath);
			return url;
		}, [apiUrlCreator, getMark, resourcePath]),
		onDone: () => {
			const mark = getMark();
			if (mark?.attrs?.hash && mark.attrs?.hash !== hash) setHash(safeDecode(mark.attrs.hash));
		},
	});

	const { call: fetchCatalogProps } = useApi<ClientCatalogProps>({
		url: useMemo(() => {
			const mark = getMark();
			const parsedHref = mark ? getHref(mark) : href;
			const catalogName = mark
				? parsedHref
					? parsedHref.split("/")?.[3] === "-"
						? parsedHref.split("/")?.[5]
						: parsedHref.split("/")?.[3]
					: ""
				: parsedHref?.split("/")?.[0];

			return apiUrlCreator.getCatalogProps(catalogName);
		}, [apiUrlCreator, href, getMark]),
		onDone: (data) => {
			setCatalogProps(data);
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const clearHandler = useCallback(() => {
		debounceClose.cancel();
		addClosedClass.cancel();
		openDebounce.cancel();
		setCanClose(true);
	}, []);

	useEffect(() => {
		const fetchDataTimeout = setTimeout(() => {
			fetchData();
			fetchCatalogProps();
		}, 450);

		return () => {
			clearTimeout(fetchDataTimeout);
		};
	}, [fetchData, fetchCatalogProps]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
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
			arrow={false}
			content={
				isVisible && (
					<TooltipProvider
						apiUrlCreator={apiUrlCreator}
						catalogProps={catalogProps}
						data={data}
						{...otherProps}
					>
						<TooltipContent
							className={classNames("tooltip-article", mods, [className])}
							clear={clearHandler}
							close={closeHandler}
							data={data}
							hash={hash}
							position={tooltipPlace}
							start={close}
						/>
					</TooltipProvider>
				)
			}
			contentClassName={classNames("tooltip-wrapper", {}, [className])}
			hideOnClick={undefined}
			interactive={true}
			setPlaceCallback={(place) => setTooltipPlace(place)}
			visible={isVisible}
		>
			<div style={{ height: "1.25rem" }} />
		</Tooltip>
	);
};

const TooltipProvider = (props: TooltipProviderProps) => {
	const { pageDataContext, apiUrlCreator, catalogProps, data, children } = props;
	if (!data) return null;

	return (
		<ApiUrlCreatorService.Provider value={apiUrlCreator.fromNewArticlePath(data.path, catalogProps?.name)}>
			<ResourceService.Provider>
				<PageDataContextService.Provider value={pageDataContext}>
					<CatalogStoreProvider data={catalogProps}>
						<ArticlePropsService.Provider value={data?.articleProps}>
							<PropertyServiceProvider.Provider>
								<ArticleRefService.Provider>
									<>{children}</>
								</ArticleRefService.Provider>
							</PropertyServiceProvider.Provider>
						</ArticlePropsService.Provider>
					</CatalogStoreProvider>
				</PageDataContextService.Provider>
			</ResourceService.Provider>
		</ApiUrlCreatorService.Provider>
	);
};

const TooltipContent = (props: TooltipContent) => {
	const { data, start, clear, className, hash } = props;
	const articleRef = ArticleRefService.value;

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

	useEffect(() => {
		const decodedHash = safeDecode(hash);
		if (!decodedHash) return;
		const anchor = document.querySelector(`.tooltip-article [id="${decodedHash.slice(1)}"]`);
		if (!anchor) return;

		anchor.scrollIntoView();
	}, [hash]);

	if (!data) return null;

	return (
		<div ref={articleRef}>
			<div className={className}>
				<MiniArticle content={data.content} title={data.title} />
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
