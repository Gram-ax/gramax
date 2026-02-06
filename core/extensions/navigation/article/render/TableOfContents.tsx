import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useGetHref from "@core-ui/useGetHref";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { forwardRef, MutableRefObject, useEffect, useRef } from "react";
import { TocItem } from "../logic/createTocItems";

const SCROLLSPY_OFFSET = 50;
type Pair = { hEl: HTMLElement; aEl: HTMLElement };

interface ScrollspyProps {
	children: JSX.Element;
	className: string;
	activeClassEl: (e: HTMLElement) => HTMLElement;
	activeClassName: string;
}

function removeActiveClassInChildren(parentElement: HTMLElement, activeClassName: string) {
	const children = parentElement.childNodes;
	children.forEach((child: HTMLElement) => {
		if (child.classList) child.classList.remove(activeClassName);
		if (child.childNodes) removeActiveClassInChildren(child, activeClassName);
	});
}

const Scrollspy = forwardRef((props: ScrollspyProps, articleElementRef: MutableRefObject<HTMLDivElement>) => {
	const { children, className, activeClassName, activeClassEl } = props;
	const navRef = useRef(null);
	const items = ArticlePropsService.value.tocItems;
	useEffect(() => {
		const el = navRef.current as HTMLElement;
		const scrollEl = articleElementRef.current;
		if (!scrollEl) return;

		let pairs: Pair[] = null;
		function refreshPairs() {
			pairs = Array.from(el.querySelectorAll("a[href]")).map((x) => {
				const href = x.attributes["href"].value as string;
				return {
					hEl: document.getElementById(href.substring(href.indexOf("#") + 1)),
					aEl: x as HTMLElement,
				};
			});
		}

		let prevAEl: HTMLElement = null;

		function onScroll() {
			if (!pairs || !pairs?.[0]?.hEl || !pairs?.[0]?.hEl.parentNode || !pairs?.[0]?.hEl.offsetTop) refreshPairs();
			// If elements are unmounted (article changed), then we need to read pairs again
			// For some reason after navigating to anchor link (href=#XXX) all DOM elements in pairs are unmounted

			const y = scrollEl.scrollTop + SCROLLSPY_OFFSET;
			let aEl = null as HTMLElement;

			if (Math.ceil(scrollEl.scrollTop + scrollEl.clientHeight) >= scrollEl.scrollHeight)
				aEl = pairs[pairs.length - 1].aEl;
			else for (let i = 0; i < pairs.length && pairs[i].hEl?.offsetTop < y; aEl = pairs[i].aEl, i++);

			if (aEl != prevAEl) {
				if (aEl) {
					removeActiveClassInChildren(navRef.current, activeClassName);
					activeClassEl(aEl)?.classList.add(activeClassName);
				}
				prevAEl = aEl;
			}
		}

		scrollEl.addEventListener("scroll", onScroll);
		return () => {
			pairs = null;
			scrollEl.removeEventListener("scroll", onScroll);
		};
	}, [items]);

	return (
		<div className={className} ref={navRef}>
			{children}
		</div>
	);
});

const Tree = ({ items, level }: { items: TocItem[]; level: number }) => {
	return (
		<ul style={{ margin: "1em 0 0 0" }}>
			{items.map((x, i) => (
				<li key={i}>
					{!x.items?.length ? (
						<a
							className={`lvl-${level}`}
							dangerouslySetInnerHTML={{ __html: x.title }}
							data-qa={`article-navigation-link-level-${level}`}
							href={useGetHref(x.url)}
						/>
					) : (
						<CategoryTree item={x} level={level} />
					)}
				</li>
			))}
		</ul>
	);
};

const CategoryTree = ({ item, level }: { item: TocItem; level: number }) => {
	// const [isExpanded, setExpanded] = useState(true);
	const href = useGetHref(item.url);

	if (!item.title) return null;

	return (
		<ul>
			<li className="expand">
				{/* <div className={`lvl-${level}`}>
						<Icon
							onClick={() => {
								setExpanded(!isExpanded);
							}}
							code={isExpanded ? "angle-down" : "angle-right"}
							className="icon"
							faFw={true}
							style={{ fontWeight: 300, verticalAlign: "baseline" }}
						/>
					</div> */}
				<a className={`lvl-${level}`} data-qa={`article-navigation-level-${level}-link`} href={href}>
					{item.title}
				</a>
			</li>
			{/* {isExpanded ? */} <Tree items={item.items} level={item.title ? level + 1 : level} /> {/* : null} */}
		</ul>
	);
};

const TableOfContents = styled(({ className }: { className?: string }) => {
	const items = ArticlePropsService.tocItems;
	const articleElement = ArticleRefService.value;

	if (!items.length || !ArticleViewService.isDefaultView) return null;

	return (
		<Scrollspy
			activeClassEl={(x) => x.parentNode as HTMLElement}
			activeClassName="active"
			className={className}
			ref={articleElement}
		>
			<>
				<div
					className="group-header"
					onClick={() => {
						articleElement.current.scrollTo({ top: 0, behavior: "auto" });
					}}
				>
					{t("in-article")}
				</div>
				<Tree items={items} level={0} />
			</>
		</Scrollspy>
	);
})`
	.group-header {
		margin-bottom: -0.5em;
	}

	.group-header:hover {
		cursor: pointer;
		color: var(--color-primary) !important;
	}

	a {
		display: inline-block;
		text-decoration: none;
		line-height: 1.2;
	}

	ul {
		margin-top: 0px;
		margin-left: -20px !important;
	}

	li > a {
		width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.active a {
		color: var(--color-primary);
		font-weight: 400;
	}

	.icon {
		cursor: pointer;
	}
	.icon:hover {
		color: var(--color-primary);
	}

	a.lvl-1,
	div.lvl-1 {
		padding-left: 12px;
	}
	a.lvl-2,
	div.lvl-2 {
		padding-left: 24px;
	}

	li.expand {
		display: flex;
		flex-direction: row;
	}
`;

export default TableOfContents;
