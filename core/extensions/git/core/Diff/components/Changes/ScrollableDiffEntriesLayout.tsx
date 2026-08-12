import { forwardRef, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ScrollableDiffEntriesLayoutProps {
	children: JSX.Element;
	maxHeight?: string;
}

const ScrollableDiffEntriesLayout = forwardRef(
	(props: ScrollableDiffEntriesLayoutProps, ref: RefObject<HTMLDivElement>) => {
		const { children, maxHeight = "50vh" } = props;
		const innerRef = useRef<HTMLDivElement>(null);
		const [shadows, setShadows] = useState({ top: false, bottom: false });

		const update = useCallback(() => {
			const el = innerRef.current;
			if (!el) return;
			const { scrollTop, scrollHeight, clientHeight } = el;
			setShadows({ top: scrollTop > 0, bottom: scrollTop < scrollHeight - clientHeight - 1 });
		}, []);

		useEffect(() => {
			const el = innerRef.current;
			if (!el) return;
			update();
			el.addEventListener("scroll", update);
			const ro = new ResizeObserver(update);
			ro.observe(el);
			return () => {
				el.removeEventListener("scroll", update);
				ro.disconnect();
			};
		}, [update]);

		useEffect(() => {
			if (ref) (ref as React.MutableRefObject<HTMLDivElement>).current = innerRef.current;
		}, [ref]);

		const boxShadow = useMemo(() => {
			const topShadow = "0px 6px 5px 0px var(--color-diff-entries-shadow) inset";
			const bottomShadow = "0px -6px 5px 0px var(--color-diff-entries-shadow) inset";
			return [shadows.top && topShadow, shadows.bottom && bottomShadow].filter(Boolean).join(", ");
		}, [shadows]);

		return (
			<div ref={innerRef} style={{ maxHeight, overflowY: "auto", boxShadow: boxShadow || undefined }}>
				{children}
			</div>
		);
	},
);

export default ScrollableDiffEntriesLayout;
