import type { Environment } from "@app/resolveModule/env";
import MiniArticle from "@components/Article/MiniArticle";
import BoxResizeWrapper from "@components/Atoms/BoxResizeWrapper";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import type PageDataContext from "@core/Context/PageDataContext";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import safeDecode from "@core/utils/safeDecode";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { useApi } from "@core-ui/hooks/useApi";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { ArticlePropsStoreProvider } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
// biome-ignore lint/style/noRestrictedImports: expected
import styled from "@emotion/styled";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import { getHref } from "@ext/markdown/elements/link/edit/logic/getHref";
import {
	setLinkTooltipHeight,
	setLinkTooltipWidth,
	useTooltipSize,
} from "@ext/markdown/elements/link/edit/logic/store/LinkTooltipSizeStore";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import type { Mark } from "@tiptap/pm/model";
import { TooltipProvider } from "@ui-kit/Tooltip";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Router } from "wouter";

type DataType = {
	path: string;
	title: string;
	content: RenderableTreeNodes;
	articleProps: ClientArticleProps;
	error?: string;
	// returned by getRenderContentByLogicPath when fetching a preview without a resourcePath
	articlePath?: string;
};

type TooltipContent = {
	data: DataType;
	start: () => void;
	clear: () => void;
	close: () => void;
	position: string;
	className?: string;
	hash?: string;
	resourceItemId?: string;
	resourceProviderType?: ArticleProviderType;
};

type TooltipProviderProps = {
	data: DataType;
	children: ReactNode;
	catalogProps: ClientCatalogProps;
	apiUrlCreator: ApiUrlCreator;
	pageDataContext: PageDataContext;
	resourceItemId?: string;
	resourceProviderType?: ArticleProviderType;
	environment: Environment;
	basePath?: string;
};

export interface LinkTooltipProps extends Omit<TooltipProviderProps, "children" | "data" | "catalogProps"> {
	closeHandler: () => void;
	catalogProps?: ClientCatalogProps;
	className?: string;
	element: HTMLElement;
	resourcePath?: string;
	getMark: () => Mark | undefined;
	hash?: string;
	href?: string;
	url?: Url;
	environment: Environment;
	basePath?: string;
}

// For a top/bottom-placed popper "up/down" is popper's alt axis: altAxis keeps the preview from
// overflowing the screen edge, tether: false lets it slide fully into view instead of clipping.
const POPPER_OPTIONS = {
	modifiers: [{ name: "preventOverflow", options: { altAxis: true, tether: false } }],
};

const MAX_SIZE_RATIO = 0.8;
const MIN_SIZE_RATIO = 0.15;
const DEFAULT_SIZE = { width: 400, height: 250 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getTooltipSizeBounds = () => ({
	minWidth: window.innerWidth * MIN_SIZE_RATIO,
	minHeight: window.innerHeight * MIN_SIZE_RATIO,
	maxWidth: window.innerWidth * MAX_SIZE_RATIO,
	maxHeight: window.innerHeight * MAX_SIZE_RATIO,
});

type TooltipSizeBounds = ReturnType<typeof getTooltipSizeBounds>;

// Stored size can come from a larger window, so clamp it back into the current viewport bounds —
// the box scrolls internally (overflow-y: scroll), so the preview always fits on screen.
const getTooltipStyle = (width: number, height: number, bounds: TooltipSizeBounds): CSSProperties => {
	if (!width || !height) return { width: `${DEFAULT_SIZE.width}px`, height: `${DEFAULT_SIZE.height}px` };

	return {
		width: `${clamp(width, bounds.minWidth, bounds.maxWidth)}px`,
		height: `${clamp(height, bounds.minHeight, bounds.maxHeight)}px`,
	};
};

const components: Record<Environment, (props: { basePath; children }) => React.ReactNode> = {
	tauri: ({ children }) => children,
	next: ({ children }) => children,
	static: ({ basePath, children }) => <Router base={basePath}>{children}</Router>,
	web: ({ children }) => children,
	cli: ({ basePath, children }) => <Router base={basePath}>{children}</Router>,
	test: ({ children }) => children,
	docportal: ({ basePath, children }) => <Router base={basePath}>{children}</Router>,
};

const ArticleLinkTooltip = (props: LinkTooltipProps) => {
	const {
		closeHandler,
		catalogProps: initialCatalogProps,
		element,
		apiUrlCreator,
		getMark,
		resourcePath,
		className,
		hash: initialHash,
		href,
		url,
		resourceItemId,
		resourceProviderType,
		...otherProps
	} = props;
	const [isVisible, setIsVisible] = useState(false);
	const [canClose, setCanClose] = useState(true);
	const [hash, setHash] = useState<string>(initialHash);
	const [catalogProps, setCatalogProps] = useState<ClientCatalogProps>(initialCatalogProps ?? null);
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

	const { call: fetchData, data } = useApi<DataType>({
		url: useMemo(() => {
			if (url) return url;
			const mark = getMark();
			const combinedResourcePath = mark?.attrs?.resourcePath || resourcePath;
			if (combinedResourcePath) return apiUrlCreator.getArticleContentByRelativePath(combinedResourcePath);
			if (href) {
				const logicPath = RouterPathProvider.getLogicPath(href);
				const catalogName = logicPath.split("/")[0];
				return apiUrlCreator
					.fromNewArticlePath(logicPath, catalogName)
					.getArticleRenderDataByLogicPath(logicPath);
			}
			return null;
		}, [apiUrlCreator, getMark, resourcePath, url, href]),
		onDone: () => {
			const mark = getMark();
			if (mark?.attrs?.hash && mark.attrs?.hash !== hash) setHash(safeDecode(mark.attrs.hash));
		},
	});

	const catalogPropsUrl = useMemo(() => {
		const mark = getMark();
		const parsedHref = mark ? getHref(mark) : href;

		if (!parsedHref) return null;

		const catalogName = mark
			? parsedHref.split("/")?.[3] === "-"
				? parsedHref.split("/")?.[5]
				: parsedHref.split("/")?.[3]
			: parsedHref.split("/")?.[0];

		return apiUrlCreator.getCatalogProps(catalogName);
	}, [apiUrlCreator, href, getMark]);

	const { call: fetchCatalogProps } = useApi<ClientCatalogProps>({
		url: catalogPropsUrl,
		onDone: (data) => {
			setCatalogProps(data);
		},
	});

	useEffect(() => {
		if (initialCatalogProps) setCatalogProps(initialCatalogProps);
	}, [initialCatalogProps]);

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
			if (!initialCatalogProps && catalogPropsUrl) fetchCatalogProps();
		}, 450);

		return () => {
			clearTimeout(fetchDataTimeout);
		};
	}, [fetchData, fetchCatalogProps, initialCatalogProps, catalogPropsUrl]);

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
					<ArticleTooltipProvider
						apiUrlCreator={apiUrlCreator}
						catalogProps={catalogProps}
						data={data}
						resourceItemId={resourceItemId}
						resourceProviderType={resourceProviderType}
						{...otherProps}
					>
						<TooltipContentComponent
							className={classNames("tooltip-article", mods, [className])}
							clear={clearHandler}
							close={closeHandler}
							data={data}
							hash={hash}
							position={tooltipPlace}
							resourceItemId={resourceItemId}
							resourceProviderType={resourceProviderType}
							start={close}
						/>
					</ArticleTooltipProvider>
				)
			}
			contentClassName={className}
			hideOnClick={undefined}
			interactive={true}
			maxWidth={window.innerWidth * 0.8}
			popperOptions={POPPER_OPTIONS}
			setPlaceCallback={(place) => setTooltipPlace(place)}
			visible={isVisible}
		>
			<div style={{ height: "1.25rem" }} />
		</Tooltip>
	);
};

const ArticleTooltipProvider = (props: TooltipProviderProps) => {
	const {
		pageDataContext,
		apiUrlCreator,
		catalogProps,
		data,
		children,
		basePath,
		environment = "web",
		resourceItemId,
		resourceProviderType,
	} = props;

	if (!data) return null;
	const RouterComponent = components[environment];

	return (
		<PlatformService.Provider value={environment}>
			<RouterComponent basePath={basePath}>
				<TooltipProvider>
					<ApiUrlCreatorService.Provider
						value={apiUrlCreator.fromNewArticlePath(data.path ?? data.articlePath, catalogProps?.name)}
					>
						<ResourceService.Provider id={resourceItemId} provider={resourceProviderType}>
							<PageDataContextService.Provider value={pageDataContext}>
								<CatalogStoreProvider data={catalogProps}>
									<ArticlePropsStoreProvider data={data?.articleProps}>
										<PropertyServiceProvider.Provider>
											<ArticleRefService.Provider>
												<>{children}</>
											</ArticleRefService.Provider>
										</PropertyServiceProvider.Provider>
									</ArticlePropsStoreProvider>
								</CatalogStoreProvider>
							</PageDataContextService.Provider>
						</ResourceService.Provider>
					</ApiUrlCreatorService.Provider>
				</TooltipProvider>
			</RouterComponent>
		</PlatformService.Provider>
	);
};

const TooltipContentComponent = (props: TooltipContent) => {
	const { data, start, clear, close, className, hash, resourceItemId, resourceProviderType } = props;
	const articleRef = ArticleRefService.value;
	const isResizeRef = useRef(false);
	const { width, height } = useTooltipSize();
	const isReadOnly = PageDataContextService.value?.conf?.isReadOnly ?? false;

	useEffect(() => {
		const handleMouseLeave = () => {
			if (isResizeRef.current) return;
			start();
		};
		const handleMouseEnter = () => clear();
		const tooltipWrapper = articleRef.current?.closest(".tippy-content");

		if (tooltipWrapper) {
			tooltipWrapper.addEventListener("mouseleave", handleMouseLeave);
			tooltipWrapper.addEventListener("mouseenter", handleMouseEnter);
		}

		return () => {
			if (tooltipWrapper) {
				tooltipWrapper.removeEventListener("mouseleave", handleMouseLeave);
				tooltipWrapper.removeEventListener("mouseenter", handleMouseEnter);
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

	const onResizeEnd = useCallback((event: MouseEvent) => {
		const wrapper = (event.target as HTMLDivElement)?.parentElement?.parentElement;
		if (!wrapper) return;

		const width = wrapper.clientWidth;
		const height = wrapper.clientHeight;

		setLinkTooltipWidth(width);
		setLinkTooltipHeight(height);

		isResizeRef.current = false;
	}, []);

	const onResizeStart = useCallback(() => {
		isResizeRef.current = true;
	}, []);

	if (!data) return null;

	const isFragment = resourceProviderType === "fragment";

	const onEditFragment = () => {
		if (!isFragment) return;
		FragmentService.openItem({ id: resourceItemId, title: data.title });
		close();
	};

	const sizeBounds = getTooltipSizeBounds();

	return (
		<div ref={articleRef}>
			<div className={className}>
				<BoxResizeWrapper
					className={"article tooltip-size bg-[var(--color-article-bg)]"}
					maxHeight={sizeBounds.maxHeight}
					maxWidth={sizeBounds.maxWidth}
					minHeight={sizeBounds.minHeight}
					minWidth={sizeBounds.minWidth}
					onResizeEnd={onResizeEnd}
					onResizeStart={onResizeStart}
					style={getTooltipStyle(width, height, sizeBounds)}
				>
					{isFragment && !isReadOnly && (
						<EditFragmentButton aria-label="Edit fragment" onClick={onEditFragment} type="button">
							<Icon code="pencil" />
						</EditFragmentButton>
					)}
					<MiniArticle content={data.content} title={data.title} />
				</BoxResizeWrapper>
			</div>
		</div>
	);
};

const EditFragmentButton = styled.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	z-index: 1;
	cursor: pointer;
	opacity: 0.6;
`;

export default styled(ArticleLinkTooltip)`
	font-size: 14px !important;
	line-height: 1.4 !important;
	padding: 0 !important;
	background: transparent !important;
	color: var(--color-article-text) !important;

	.tooltip-open {
		animation: TooltipAppend 50ms linear forwards;
	}

	.tooltip-closed {
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
