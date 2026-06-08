import { tv } from "tailwind-variants";

const indentStyles = tv({
	base: "flex items-center overflow-hidden text-ellipsis whitespace-nowrap w-full",
	variants: {
		type: {
			item: "text-[var(--color-merge-request-text-accent)] font-light",
			resource: "text-[var(--color-merge-request-text)] [&>:first-of-type]:opacity-80",
		},
	},
	defaultVariants: { type: "item" },
});

interface DiffEntryIndentProps {
	type: "item" | "resource";
	indent: number;
	checkboxIndent: boolean;
	children: React.ReactNode;
}

const DiffEntryIndent = ({ type, indent, checkboxIndent, children }: DiffEntryIndentProps) => (
	<span
		className={indentStyles({ type })}
		style={{
			marginLeft: `${indent + 1.05 + (checkboxIndent ? 0.15 : 0)}rem`,
			marginRight: "1.65em",
		}}
	>
		{children}
	</span>
);

export default DiffEntryIndent;
