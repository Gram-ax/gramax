import styled from "@emotion/styled";
import {
	forwardRef,
	type HTMLAttributes,
	type ReactNode,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { tv } from "tailwind-variants";

const scrollShadowContainerStyles = tv({
	base: "relative overflow-hidden",
	slots: {
		shadow: "pointer-events-none absolute left-0 right-0 z-10",
		topShadow: "top-0 bg-gradient-to-b from-shadow-scroll to-transparent opacity-5 scroll-shadow-top",
		bottomShadow: "bottom-0 bg-gradient-to-t from-shadow-scroll to-transparent opacity-5 scroll-shadow-bottom",
		content: "h-full w-full overflow-auto",
	},
});

export interface LegacyScrollShadowContainerProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	wrapperClassName?: string;
	shadowTopClassName?: string;
	shadowBottomClassName?: string;
}

/**
 * @deprecated Use `ScrollShadowContainer` instead
 */
const UnStyledLegacyScrollShadowContainer = forwardRef<HTMLDivElement, LegacyScrollShadowContainerProps>(
	({ className, children, shadowTopClassName, shadowBottomClassName, wrapperClassName, ...props }, ref) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const [showTopShadow, setShowTopShadow] = useState(false);
		const [showBottomShadow, setShowBottomShadow] = useState(false);

		const { base, shadow, topShadow, bottomShadow, content } = scrollShadowContainerStyles();

		useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

		const checkScroll = useCallback(() => {
			if (!containerRef.current) return;

			const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

			setShowTopShadow(scrollTop > 0);

			setShowBottomShadow(scrollTop < scrollHeight - clientHeight - 1);
		}, []);

		useEffect(() => {
			const container = containerRef.current;
			if (!container) return;
			checkScroll();
			container.addEventListener("scroll", checkScroll);
			return () => {
				container.removeEventListener("scroll", checkScroll);
			};
		}, [checkScroll]);

		return (
			<div className={base({ className: className })} {...props}>
				{showTopShadow && (
					<div className={shadow({ className: topShadow({ className: shadowTopClassName }) })} />
				)}

				<div className={content({ wrapperClassName })} ref={containerRef}>
					{children}
				</div>

				{showBottomShadow && (
					<div className={shadow({ className: bottomShadow({ className: shadowBottomClassName }) })} />
				)}
			</div>
		);
	},
);

export const LegacyScrollShadowContainer = styled(UnStyledLegacyScrollShadowContainer)`
	.to-transparent {
		--tw-gradient-to: transparent var(--tw-gradient-to-position);
	}

	.from-shadow-scroll {
		--tw-gradient-from: hsl(222, 47%, 11%) var(--tw-gradient-from-position);
		--tw-gradient-to: hsl(222 47% 11% / 0) var(--tw-gradient-to-position);
		--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
	}

	.scroll-shadow-top,
	.scroll-shadow-bottom {
		height: 10px;
		opacity: 0.05;
	}
`;

LegacyScrollShadowContainer.displayName = "LegacyScrollShadowContainer";
