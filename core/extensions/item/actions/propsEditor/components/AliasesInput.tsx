import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { OverflowTooltip } from "@ui-kit/Tooltip";
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface AliasesInputProps {
	value: string[];
	onChange: (aliases: string[]) => void;
	placeholder?: string;
	/** Extra node rendered inside a row after the path, e.g. an origin marker with a tooltip. */
	itemSuffix?: (alias: string, index: number) => ReactNode;
}

const normalizeAlias = (raw: string) =>
	raw
		.trim()
		.replace(/^\/+|\/+$/g, "")
		.trim();

/* rows are glued into a single block, same as the file list of FileUploadCompact */
const rowShape = (index: number, total: number) => {
	if (total === 1) return "";
	if (index === 0) return "border-b-0 rounded-b-none";
	if (index === total - 1) return "rounded-t-none";
	return "border-b-0 rounded-none";
};

const AliasesInput = ({ value, onChange, placeholder, itemSuffix }: AliasesInputProps) => {
	const [inputValue, setInputValue] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
	const highlightTimer = useRef<ReturnType<typeof setTimeout>>(null);

	useEffect(() => () => clearTimeout(highlightTimer.current), []);

	const removeAlias = useCallback(
		(index: number) => {
			onChange(value.filter((_, i) => i !== index));
			inputRef.current?.focus();
		},
		[value, onChange],
	);

	const highlightExisting = (index: number) => {
		rowRefs.current[index]?.scrollIntoView({ block: "nearest" });
		setHighlightedIndex(index);
		if (highlightTimer.current) clearTimeout(highlightTimer.current);
		highlightTimer.current = setTimeout(() => setHighlightedIndex(null), 1500);
	};

	const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && inputValue.trim()) {
			e.preventDefault();
			const alias = normalizeAlias(inputValue);
			if (!alias) return;
			const existingIndex = value.indexOf(alias);
			if (existingIndex !== -1) return highlightExisting(existingIndex);
			onChange([...value, alias]);
			setInputValue("");
		}
	};

	return (
		<div className="flex w-full flex-col gap-2">
			<Input
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleInputKeyDown}
				placeholder={placeholder}
				ref={inputRef}
				value={inputValue}
			/>
			{value.length > 0 && (
				<div className="flex max-h-[27.25rem] flex-col overflow-y-auto">
					{value.map((alias, index) => (
						<div
							className={cn(
								"box-border flex h-10 shrink-0 items-center gap-2 rounded-lg border border-secondary-border bg-background p-2.5 pr-1",
								rowShape(index, value.length),
								highlightedIndex === index && "bg-secondary-bg",
							)}
							key={alias}
							ref={(el) => {
								rowRefs.current[index] = el;
							}}
						>
							<div className="size-5 shrink-0">
								<Icon className="text-muted" icon="link-2" size="lg" />
							</div>
							<OverflowTooltip className="min-w-0 flex-1 truncate text-sm font-medium" triggerTag="span">
								{alias}
							</OverflowTooltip>
							{itemSuffix?.(alias, index)}
							<IconButton
								aria-label={t("delete")}
								className="shrink-0"
								icon="x"
								iconClassName="size-4"
								onClick={() => removeAlias(index)}
								size="sm"
								type="button"
								variant="text"
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default AliasesInput;
