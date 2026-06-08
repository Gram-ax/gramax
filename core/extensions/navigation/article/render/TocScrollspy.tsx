import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { createContext, forwardRef, type MutableRefObject, useContext, useEffect, useRef, useState } from "react";
import { tv } from "tailwind-variants";

const SCROLLSPY_OFFSET = 50;
type Pair = { hEl: HTMLElement; aEl: HTMLElement; url: string };

const tocScrollspyStyles = tv({
	base: "[&_ul]:pl-5 [&_ul]:mt-0 [&_ul]:-ml-5!",
});

export const TocActiveUrlContext = createContext<string>(null);

export const useTocActiveUrl = () => useContext(TocActiveUrlContext);

interface TocScrollspyProps {
	children: JSX.Element;
	className?: string;
}

const TocScrollspy = forwardRef((props: TocScrollspyProps, articleElementRef: MutableRefObject<HTMLDivElement>) => {
	const { children, className } = props;
	const navRef = useRef<HTMLDivElement>(null);
	const items = ArticlePropsService.value.tocItems;
	const [activeUrl, setActiveUrl] = useState<string>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		const el = navRef.current as HTMLElement;
		const scrollEl = articleElementRef.current;
		if (!scrollEl) return;

		let pairs: Pair[] = null;
		function refreshPairs() {
			pairs = Array.from(el.querySelectorAll("a[href]")).map((x) => {
				const href = x.getAttribute("href") as string;
				return {
					hEl: document.getElementById(href.substring(href.indexOf("#") + 1)),
					aEl: x as HTMLElement,
					url: href,
				};
			});
		}

		let prevUrl: string = null;

		function onScroll() {
			if (
				!pairs ||
				!pairs?.[0]?.hEl ||
				!pairs?.[0]?.hEl.parentNode ||
				!pairs?.[0]?.hEl.offsetTop ||
				!pairs?.[0]?.aEl.isConnected
			)
				refreshPairs();
			const y = scrollEl.scrollTop + SCROLLSPY_OFFSET;
			let active = null as Pair;

			if (Math.ceil(scrollEl.scrollTop + scrollEl.clientHeight) >= scrollEl.scrollHeight)
				active = pairs[pairs.length - 1];
			else for (let i = 0; i < pairs.length && pairs[i].hEl?.offsetTop < y; active = pairs[i], i++);

			if (active?.url !== prevUrl) {
				prevUrl = active?.url ?? null;
				setActiveUrl(prevUrl);

				if (active) {
					const nav = navRef.current;
					const navRect = nav.getBoundingClientRect();
					const elRect = active.aEl.getBoundingClientRect();
					if (
						elRect.top < navRect.top + SCROLLSPY_OFFSET ||
						elRect.bottom > navRect.bottom - SCROLLSPY_OFFSET
					) {
						const scrollTop = nav.scrollTop + (elRect.top - navRect.top) - SCROLLSPY_OFFSET;
						nav.scrollTo({ top: scrollTop, behavior: "smooth" });
					}
				}
			}
		}

		scrollEl.addEventListener("scroll", onScroll);
		return () => {
			pairs = null;
			scrollEl.removeEventListener("scroll", onScroll);
		};
	}, [items]);

	return (
		<TocActiveUrlContext.Provider value={activeUrl}>
			<ScrollShadowContainer
				className={tocScrollspyStyles({ className })}
				data-testid="table-of-contents"
				ref={navRef}
			>
				{children}
			</ScrollShadowContainer>
		</TocActiveUrlContext.Provider>
	);
});

export default TocScrollspy;
