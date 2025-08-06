import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import BoxResizeWrapper from "@components/Atoms/BoxResizeWrapper";
import DragWrapper from "@components/Atoms/DragWrapper";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import SmallEditor from "@ext/inbox/components/Editor/SmallEditor";
import { PopoverPosition, PopoverRect } from "@ext/articleProvider/logic/Popover";
import getExtensions, { GetExtensionsPropsOptions } from "@ext/markdown/core/edit/logic/getExtensions";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import Document from "@tiptap/extension-document";
import { Extensions, JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import FetchService from "@core-ui/ApiServices/FetchService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import TopBarControllers from "@ext/articleProvider/components/TopBarControllers";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";

type ItemProps = ProviderItemProps & {
	props: Record<string, any>;
};

interface TooltipContentProps {
	item: ItemProps;
	articleType: ArticleProviderType;
	extensions?: Extensions;
	options?: GetExtensionsPropsOptions;
	onUpdate?: (id: string, content: JSONContent, title: string) => void;
	onClose?: () => void;
}

export interface TooltipEditorProps extends TooltipContentProps {
	selectedIds: string[];
	apiUrlCreator: ApiUrlCreator;
	tooltipPosition: PopoverPosition;
	rect: PopoverRect;
	isPinned: boolean;
	setIsPinned: (isPinned: boolean) => void;
	updateRect: (rect: Partial<PopoverRect>) => void;
	onOutsideClick?: () => void;
}

const TooltipWrapper = styled.div`
	max-width: inherit;
	max-height: inherit;
	overflow: hidden;
	height: 100%;
	width: 100%;
`;

const TooltipContentWrapper = styled.div`
	max-width: inherit;
	max-height: inherit;
	padding: 10px;
	padding-top: 0.3rem;
	height: 100%;
	width: 100%;
	font-size: 0.85rem;
	overflow: hidden;
	overflow-y: auto;
	scrollbar-gutter: stable;

	.mat-under-article {
		min-height: unset;
	}
`;

const ContainerWrapper = styled.div`
	position: fixed;
	z-index: var(--z-index-popover);
	border-radius: var(--radius-large);
	background: var(--color-article-bg);
	box-shadow: var(--menu-tooltip-shadow) !important;
	width: 30rem;
	max-height: min(45rem, 60vh);
`;

const getTooltipExtensions = (extensions: Extensions, options?: GetExtensionsPropsOptions): Extensions => [
	...getExtensions(options),
	Comment,
	Document.extend({
		content: "paragraph block+",
	}),
	...extensions,
];

const TooltipContent = ({ item, articleType, extensions, onUpdate, onClose, options }: TooltipContentProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [isLoading, setIsLoading] = useState(true);
	const [content, setContent] = useState<JSONContent>(null);

	const updateCallback = useCallback(
		(id: string, content: JSONContent, title: string) => {
			onUpdate?.(id, content, title);
		},
		[onUpdate],
	);

	const fetchContent = useCallback(async () => {
		setIsLoading(true);
		const res = await FetchService.fetch(apiUrlCreator.getEditTreeInGramaxDir(item.id, articleType));

		if (!res.ok) return setIsLoading(false);
		const content = await res.json();

		setContent(getArticleWithTitle(item.title, content));
		setIsLoading(false);
	}, [item.id, item.title, apiUrlCreator, articleType]);

	useEffect(() => {
		fetchContent();
	}, []);

	return (
		<TooltipWrapper>
			<TooltipContentWrapper className="tooltip-content">
				<TopBarControllers onClose={onClose} />
				<MinimizedArticleStyled>
					{isLoading ? (
						<SpinnerLoader />
					) : (
						<SmallEditor
							props={{
								title: item.title,
								...(item.props || {}),
								content,
							}}
							content={content}
							id={item.id}
							extensions={getTooltipExtensions(extensions, options)}
							updateCallback={updateCallback}
							articleType={articleType}
						/>
					)}
				</MinimizedArticleStyled>
			</TooltipContentWrapper>
		</TooltipWrapper>
	);
};

const TooltipArticleView = (props: TooltipEditorProps) => {
	const {
		item,
		apiUrlCreator,
		tooltipPosition,
		rect,
		updateRect,
		setIsPinned,
		isPinned,
		articleType,
		onUpdate,
		onClose,
		onOutsideClick,
		extensions = [],
		options,
	} = props;
	const resizeRef = useRef(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const newX = rect?.x ?? tooltipPosition.x;
	const newY = rect?.y ?? tooltipPosition.y;
	const newWidth = rect?.width ? `${rect.width}px` : undefined;
	const newHeight = rect?.height ? `${rect.height}px` : undefined;

	const onDragEnd = () => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		const x = parseInt(wrapper.style.left);
		const y = parseInt(wrapper.style.top);
		setIsPinned(true);

		updateRect({ x, y, width: rect?.width, height: rect?.height });
	};

	const onResizeStart = () => {
		resizeRef.current = true;
	};

	const onResizeEnd = () => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		const x = rect?.x && parseInt(wrapper.style.left);
		const y = rect?.y && parseInt(wrapper.style.top);
		const width = wrapper.clientWidth;
		const height = wrapper.clientHeight;

		resizeRef.current = false;

		updateRect({ x, y, width, height });
	};

	useEffect(() => {
		if (isPinned) return;

		const handleClickOutside = (event) => {
			event.stopPropagation();
			event.preventDefault();
			const isOutside = wrapperRef.current && !wrapperRef.current.contains(event.target);

			if (isOutside && !resizeRef.current) {
				onOutsideClick?.();
			}
		};

		document.addEventListener("click", handleClickOutside);

		return () => document.removeEventListener("click", handleClickOutside);
	}, [wrapperRef.current, isPinned, onOutsideClick]);

	return (
		<ApiUrlCreatorService.Provider value={apiUrlCreator}>
			<ContainerWrapper
				ref={wrapperRef}
				style={{
					left: newX,
					top: newY,
					width: newWidth,
					height: newHeight,
					maxWidth: newWidth,
					maxHeight: newHeight,
				}}
			>
				<DragWrapper ref={wrapperRef} onDragEnd={onDragEnd}>
					<BoxResizeWrapper
						ref={wrapperRef}
						maxWidth={window.innerWidth * 0.5}
						maxHeight={window.innerHeight * 0.8}
						minWidth={window.innerWidth * 0.1}
						minHeight={window.innerHeight * 0.06}
						onResizeStart={onResizeStart}
						onResizeEnd={onResizeEnd}
					>
						<TooltipContent
							item={item}
							articleType={articleType}
							onUpdate={onUpdate}
							onClose={onClose}
							extensions={extensions}
							options={options}
						/>
					</BoxResizeWrapper>
				</DragWrapper>
			</ContainerWrapper>
		</ApiUrlCreatorService.Provider>
	);
};

export default TooltipArticleView;
