import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

const highlightStyles = tv({
	base: [
		"group flex relative items-center w-full m-0 py-[0.15em] h-5 leading-[1.33em] cursor-pointer",
		"before:content-[''] before:flex before:absolute before:items-center before:left-[3px] before:top-[10%] before:w-[3px] before:h-[80%]",
		"hover:bg-[var(--color-merge-request-hover)]",
	],
	variants: {
		active: {
			true: "bg-[var(--color-merge-request-hover)]",
			false: "",
		},
		status: {
			[FileStatus.new]: "before:bg-[var(--color-status-new)]",
			[FileStatus.delete]: "before:bg-[var(--color-status-deleted)]",
			[FileStatus.modified]: "before:bg-[var(--color-status-modified)]",
			[FileStatus.rename]: "before:bg-[var(--color-status-rename)]",
			[FileStatus.conflict]: "",
			[FileStatus.current]: "",
		},
	},
	defaultVariants: { active: false },
});

interface DiffEntryHighlightProps extends HTMLAttributes<HTMLDivElement> {
	active: boolean;
	status: FileStatus;
}

const DiffEntryHighlight = ({ active, status, children, onClick, ...props }: DiffEntryHighlightProps) => (
	<div className={highlightStyles({ active, status })} onClick={onClick} {...props}>
		{children}
	</div>
);

export default DiffEntryHighlight;
