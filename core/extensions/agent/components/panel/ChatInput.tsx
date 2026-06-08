import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import clsx from "clsx";
import { type KeyboardEvent, useCallback } from "react";

type Props = {
	value: string;
	onChange: (v: string) => void;
	onSubmit: () => void;
	onCancel?: () => void;
	disabled?: boolean;
	sending?: boolean;
};

function ChatInput({ value, onChange, onSubmit, onCancel, disabled, sending }: Props) {
	const submit = useCallback(() => {
		if (disabled || !value.trim()) return;
		onSubmit();
	}, [disabled, onSubmit, value]);

	const insertNewline = useCallback(
		(el: HTMLTextAreaElement) => {
			const start = el.selectionStart ?? 0;
			const end = el.selectionEnd ?? 0;
			const next = `${value.slice(0, start)}\n${value.slice(end)}`;
			onChange(next);
			const pos = start + 1;
			requestAnimationFrame(() => {
				el.focus();
				el.setSelectionRange(pos, pos);
			});
		},
		[onChange, value],
	);

	const onKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key !== "Enter") return;

			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				if (!disabled) insertNewline(e.currentTarget);
				return;
			}

			if (e.shiftKey) {
				return;
			}

			e.preventDefault();
			submit();
		},
		[disabled, insertNewline, submit],
	);
	const isDisabled = sending ? false : !value.trim() || disabled;

	const handleClick = sending ? onCancel : submit;
	const Icon = sending ? "square" : "arrow-up";
	return (
		<div className="w-full min-w-0">
			<div className="w-full flex gap-1 pl-2.5 py-2 pr-2 rounded-xl border-primary-border border-[0.5px] bg-background shadow-soft-sm">
				<div className="flex flex-col pl-1 text-left w-full min-w-0 gap-2 -mt-px self-baseline">
					<div className="flex items-center gap-2 w-full min-h-6">
						<AutogrowTextarea
							className={clsx(
								"min-h-0 p-0 lg:p-0 rounded-none focus:rounded-none text-sm focus:bg-transparent focus:border-transparent w-full resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-0 shadow-none!",
								"shadow-none shadow-soft-none hover:shadow-soft-none focus:shadow-soft-none active:shadow-soft-none invalid:shadow-soft-none aria-[invalid=true]:shadow-soft-none",
								"hover:shadow-none",
								"focus:shadow-none",
								"active:shadow-none",
								"invalid:shadow-none",
								"aria-[invalid=true]:shadow-none",
							)}
							maxRows={12}
							minRows={1}
							onChange={(e) => onChange(e.target.value)}
							onKeyDown={onKeyDown}
							placeholder={t("agent.input.placeholder")}
							value={value}
						/>

						<div className="flex items-center self-end">
							<IconButton
								className="rounded-full p-1"
								disabled={isDisabled}
								icon={Icon}
								iconClassName="size-4"
								onClick={handleClick}
								size="xs"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export { ChatInput };
