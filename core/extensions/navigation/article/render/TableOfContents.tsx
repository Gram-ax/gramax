import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import styled from "@emotion/styled";
import { MutableRefObject, forwardRef, useEffect, useRef } from "react";
import useLocalize from "../../../localization/useLocalize";
import { TocItem } from "../logic/createTocItems";

const SCROLLSPY_OFFSET = 50;
type Pair = { hEl: HTMLElement; aEl: HTMLElement };

const Scrollspy = forwardRef(
	(
		{
			children,
			className,
			activeClassName,
			activeClassEl,
		}: {
			children: JSX.Element;
			className: string;
			activeClassEl: (e: HTMLElement) => HTMLElement;
			activeClassName: string;
		},
		articleElementRef: MutableRefObject<HTMLDivElement>,
	) => {
		const navRef = useRef(null);
		const items = ArticlePropsService.value.tocItems;
		useEffect(() => {
			const el = navRef.current as HTMLElement;
			const scrollEl = articleElementRef.current.parentNode.parentNode as HTMLElement;
			if (!scrollEl) return;

			let pairs: Pair[] = null;
			function refreshPairs() {
				pairs = Array.from(el.querySelectorAll("a[href]")).map((x) => ({
					hEl: document.getElementById(x.attributes["href"].value.substring(1)),
					aEl: x as HTMLElement,
				}));
			}

			let prevAEl: HTMLElement = null;

			function onScroll() {
				if (!pairs || !pairs[0].hEl || !pairs[0]?.hEl.parentNode || !pairs[0]?.hEl.offsetTop) refreshPairs();
				// если элементы размонтировались (сменилась статья), тогда надо заново прочитать пары
				// почему-то после перехода по анкорной ссылке (href=#XXX) все DOM-элементы в pairs размонтируются

				const y = scrollEl.scrollTop + SCROLLSPY_OFFSET;
				let aEl = null as HTMLElement;

				if (Math.ceil(scrollEl.scrollTop + scrollEl.clientHeight) >= scrollEl.scrollHeight)
					aEl = pairs[pairs.length - 1].aEl;
				else for (let i = 0; i < pairs.length && pairs[i].hEl?.offsetTop < y; aEl = pairs[i].aEl, i++);

				if (aEl != prevAEl) {
					prevAEl && activeClassEl(prevAEl)?.classList.remove(activeClassName);
					aEl && activeClassEl(aEl)?.classList.add(activeClassName);
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
	},
);

const Tree = ({ items, level }: { items: TocItem[]; level: number }) => {
	return (
		<>
			{items.map((x, i) => (
				<li key={i}>
					{!x.items?.length ? (
						<a
							className={`lvl-${level}`}
							href={x.url}
							dangerouslySetInnerHTML={{ __html: x.title }}
							data-qa={`article-navigation-link-level-${level}`}
						/>
					) : (
						<CategoryTree item={x} level={level} />
					)}
				</li>
			))}
		</>
	);
};

const CategoryTree = ({ item, level }: { item: TocItem; level: number }) => {
	// const [isExpanded, setExpanded] = useState(true);
	return (
		<ul>
			{item.title ? (
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
					<a className={`lvl-${level}`} href={item.url} data-qa={`article-navigation-level-${level}-link`}>
						{item.title}
					</a>
				</li>
			) : null}
			{/* {isExpanded ? */} <Tree items={item.items} level={item.title ? level + 1 : level} /> {/* : null} */}
		</ul>
	);
};

const TableOfContents = styled(({ className }: { className?: string }) => {
	const items = ArticlePropsService.tocItems;
	const articleElement = ArticleRefService.value;
	return !items.length ? null : (
		<Scrollspy
			ref={articleElement}
			className={className}
			activeClassName="active"
			activeClassEl={(x) => x.parentNode as HTMLElement}
		>
			<>
				<div
					className="group-header"
					onClick={() => {
						articleElement.current.scrollTo({ top: 0, behavior: "auto" });
					}}
				>
					{useLocalize("inArticle")}
				</div>
				<ul>
					<Tree items={items} level={0} />
				</ul>
			</>
		</Scrollspy>
	);
})`
	.group-header:hover {
		cursor: pointer;
		color: var(--color-primary) !important;
	}

	a {
		display: inline-block;
		text-decoration: none;
	}

	ul {
		margin-left: -20px !important;
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
