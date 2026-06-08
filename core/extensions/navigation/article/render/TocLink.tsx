import { tv } from "tailwind-variants";

export type TocLinkLevel = 0 | 1 | 2 | 3 | 4;

interface TocLinkProps {
	href: string;
	level: TocLinkLevel;
	active?: boolean;
	children: React.ReactNode;
}

const tocLinkStyles = tv({
	base: "block no-underline text-xs w-full overflow-hidden whitespace-nowrap h-7 text-ellipsis text-[var(--color-primary-general)] hover:text-[var(--color-primary)]",
	variants: {
		level: {
			0: "",
			1: "pl-3",
			2: "pl-6",
			3: "pl-9",
			4: "pl-12",
		},
		active: {
			true: "active text-[var(--color-primary)] font-normal",
			false: "",
		},
	},
	defaultVariants: { level: 0, active: false },
});

export const TocLink = ({ href, level, active = false, children }: TocLinkProps) => (
	<a className={tocLinkStyles({ level, active })} data-qa={`article-navigation-link-level-${level}`} href={href}>
		{children}
	</a>
);
