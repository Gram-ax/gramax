import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Divider } from "@ui-kit/Divider";
import { Icon } from "@ui-kit/Icon";
import { Label } from "@ui-kit/Label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type MouseEvent, type ReactNode, useState } from "react";
import {
	EMPTY_PLACEHOLDER,
	entriesOf,
	isContainer,
	isCopyableLeaf,
	isDefaultOpen,
	resolveValue,
	toCopyText,
} from "../utils/toolPayloadUtils";
import { tryParseJson } from "../utils/tryParseJson";
import { JsonViewButton } from "./JsonViewButton";

interface SectionBoxProps {
	label: string;
	children: ReactNode;
}

const SectionBox = ({ label, children }: SectionBoxProps) => {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between gap-2">
				<Label>{label}</Label>
			</div>
			<div className="w-full rounded-lg border border-secondary-border bg-secondary-bg pl-3 pr-1 py-2.5 shadow-soft-sm outline-none transition-colors lg:py-2 font-sans text-xs text-primary-fg">
				{children}
			</div>
		</div>
	);
};

const Chevron = ({ open }: { open: boolean }) => {
	return (
		<Icon
			className={cn("size-3 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")}
			icon="chevron-down"
		/>
	);
};

const IndexBadge = ({ index }: { index: number }) => {
	return <span className="shrink-0 text-[0.65rem] leading-none text-muted-foreground/60 tabular-nums">#{index}</span>;
};

interface RowGutterProps {
	expandable: boolean;
	open?: boolean;
	index?: number;
	reserve?: boolean;
}

const RowGutter = ({ expandable, open, index, reserve = true }: RowGutterProps) => {
	if (expandable) {
		return (
			<span className="flex min-w-4 shrink-0 select-none items-center gap-0.5">
				<Chevron open={!!open} />
				{index !== undefined && <IndexBadge index={index} />}
			</span>
		);
	}
	if (index !== undefined) {
		return (
			<span className="flex min-w-4 shrink-0 select-none items-center justify-end">
				<IndexBadge index={index} />
			</span>
		);
	}
	if (!reserve) return null;
	return <span className="min-w-4 shrink-0" />;
};

const PrimitiveValue = ({ value }: { value: unknown }) => {
	if (value === null || value === undefined)
		return <span className="text-muted-foreground">{EMPTY_PLACEHOLDER}</span>;

	if (typeof value === "string") {
		if (/^https?:\/\//.test(value)) {
			return (
				<a
					className="break-all text-[color:var(--color-link)] underline underline-offset-2 hover:opacity-80"
					href={value}
					rel="noreferrer"
					target="_blank"
				>
					{value}
				</a>
			);
		}
		if (value === "") return <span className="text-muted-foreground italic">{EMPTY_PLACEHOLDER}</span>;
		return <span className="whitespace-pre-wrap break-words text-primary-fg">{value}</span>;
	}

	if (typeof value === "number") return <span className="tabular-nums text-primary-fg">{String(value)}</span>;
	if (typeof value === "boolean") return <span className="text-primary-fg">{value ? t("yes") : t("no")}</span>;

	return <span className="text-muted-foreground">{String(value)}</span>;
};

const CopyableValue = ({ value }: { value: unknown }) => {
	const [copied, setCopied] = useState(false);

	const onClickHandler = (event: MouseEvent<HTMLSpanElement>) => {
		event.preventDefault();
		event.stopPropagation();
		void tryCopyToClipboard(toCopyText(value), { showPopover: false }).then((ok) => setCopied(ok));
	};

	const onOpenChange = (open: boolean) => {
		if (open) setCopied(false);
	};

	return (
		<Tooltip delayDuration={0} onOpenChange={onOpenChange}>
			<TooltipTrigger asChild>
				<span
					className="-mx-1 min-w-0 cursor-pointer rounded px-1 transition-colors hover:bg-secondary-bg-hover"
					onClick={onClickHandler}
					onPointerDown={(event) => event.preventDefault()}
				>
					<PrimitiveValue value={value} />
				</span>
			</TooltipTrigger>
			<TooltipContent onPointerDownOutside={(event) => event.preventDefault()}>
				{copied ? t("copied") : t("click-to-copy")}
			</TooltipContent>
		</Tooltip>
	);
};

const NESTING_INDENT = "ml-2";

interface NodeProps {
	name: string | number;
	value: unknown;
	depth: number;
	isIndex: boolean;
	reserveGutter?: boolean;
	headerLabel?: ReactNode;
}

const Node = ({ name, value, depth, isIndex, reserveGutter = true, headerLabel }: NodeProps) => {
	const resolved = resolveValue(value);
	const container = isContainer(resolved);
	const entries = container ? entriesOf(resolved) : [];
	const [open, setOpen] = useState(() => isDefaultOpen(entries.length, depth));

	const arrayIndex = isIndex ? Number(name) : undefined;
	const keyLabel =
		headerLabel ??
		(!isIndex && <span className="shrink-0 font-medium text-muted-foreground">{String(name)}:</span>);

	if (!container) {
		return (
			<div className="flex items-baseline gap-1 rounded px-1 text-secondary-fg">
				<RowGutter expandable={false} index={arrayIndex} reserve={reserveGutter} />
				{keyLabel}
				{isCopyableLeaf(resolved) ? (
					<CopyableValue value={resolved} />
				) : (
					<span className="min-w-0">
						<PrimitiveValue value={resolved} />
					</span>
				)}
			</div>
		);
	}

	return (
		<div className="text-secondary-fg">
			<div className="group relative flex items-center rounded">
				<button
					aria-expanded={open}
					className="flex min-w-0 cursor-pointer items-center rounded px-1 text-left"
					onClick={() => setOpen((o) => !o)}
					type="button"
				>
					<RowGutter expandable index={arrayIndex} open={open} />
					{keyLabel}
				</button>
				<JsonViewButton className="absolute right-1 top-1/2 -translate-y-1/2" inline source={resolved} />
			</div>
			{open && (
				<div className={cn(NESTING_INDENT, "flex items-stretch")}>
					<Divider className="h-auto self-stretch" orientation="vertical" />
					<div className="min-w-0 flex-1 pl-1.5">
						{entries.length === 0 ? (
							<div className="flex items-baseline gap-1 px-1 py-px">
								<RowGutter expandable={false} />
								<span className="text-muted-foreground">{EMPTY_PLACEHOLDER}</span>
							</div>
						) : (
							entries.map(([k, v]) => (
								<Node
									depth={depth + 1}
									isIndex={Array.isArray(resolved)}
									key={String(k)}
									name={k}
									value={v}
								/>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

const ContainerSummary = ({ value }: { value: unknown }) => {
	const isArray = Array.isArray(value);
	const count = isArray ? (value as unknown[]).length : Object.keys(value as Record<string, unknown>).length;
	return (
		<span className="flex shrink-0 items-center gap-1 text-[0.65rem] leading-none text-muted-foreground/60 tabular-nums">
			<Icon className="size-2.5 shrink-0" icon={isArray ? "brackets" : "braces"} />
			<span>{count}</span>
		</span>
	);
};

export interface PayloadValueProps {
	value: unknown;
	depth?: number;
}

export const PayloadValue = ({ value, depth = 0 }: PayloadValueProps) => {
	const resolved = resolveValue(value);

	if (!isContainer(resolved)) {
		return (
			<div className="flex items-baseline px-1 text-secondary-fg">
				<PrimitiveValue value={resolved} />
			</div>
		);
	}

	return (
		<div className="text-xs">
			<Node
				depth={depth}
				headerLabel={<ContainerSummary value={resolved} />}
				isIndex={false}
				name=""
				value={resolved}
			/>
		</div>
	);
};

export interface ToolPayloadSectionProps {
	filterKeys?: string[];
	label: string;
	payload?: Record<string, unknown>;
}

export const ToolPayloadSection = ({ filterKeys, label, payload: payloadProp }: ToolPayloadSectionProps) => {
	if (!payloadProp) return null;

	const payload = Object.fromEntries(
		Object.entries(payloadProp).filter(([k, v]) => v !== undefined && !filterKeys?.includes(k)),
	);
	if (Object.keys(payload).length === 0) return null;

	return (
		<SectionBox label={label}>
			<PayloadValue value={payload} />
		</SectionBox>
	);
};

export interface ToolResultSectionProps {
	content?: string;
	contentPreview?: string;
	fullLength?: number;
	label: string;
}

export const ToolResultSection = ({ content, contentPreview, fullLength, label }: ToolResultSectionProps) => {
	if (!content && !contentPreview) return null;

	const parsed = tryParseJson(content ?? contentPreview ?? "");
	if (parsed.ok) {
		return (
			<SectionBox label={label}>
				<PayloadValue value={parsed.value} />
			</SectionBox>
		);
	}

	const preview = contentPreview ?? content ?? "";
	const truncated = typeof fullLength === "number" && fullLength > 0 && preview.length < fullLength;

	return (
		<SectionBox label={label}>
			<pre className="w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs m-0">
				{preview}
			</pre>
			{truncated && <div className="mt-1 text-xs text-muted-foreground">{fullLength} chars total</div>}
		</SectionBox>
	);
};
