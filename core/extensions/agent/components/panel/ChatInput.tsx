import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cn } from "@core-ui/utils/cn";
import { useAutoFocusTextarea } from "@ext/agent/components/hooks/useAutoFocusTextarea";
import { ChatToolsMenu } from "@ext/agent/components/panel/ChatToolsMenu";
import { SessionContextUsage } from "@ext/agent/components/panel/SessionContextUsage";
import useChatStore, { useChatDraft } from "@ext/agent/components/store/ChatStore";
import type { AgentDraftAttachment } from "@ext/agent/components/types/chat";
import { serializeAttachments } from "@ext/agent/components/utils/serializeAttachments";
import { AgentAttachmentStore } from "@ext/agent/core/attachmentStore";
import t from "@ext/localization/locale/translate";
import { Alert, AlertDescription, AlertIcon } from "@ui-kit/Alert";
import { IconButton } from "@ui-kit/Button";
import { Tag } from "@ui-kit/Tag";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { OverflowTooltip, Tooltip, TooltipContent, TooltipText, TooltipTitle, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ChangeEvent, type KeyboardEvent, useCallback, useState } from "react";

const MAX_ATTACHMENT_SIZE_MB = 50;
const MAX_ATTACHMENT_SIZE = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

type Props = {
	attachments: AgentDraftAttachment[];
	onAttachmentsChange: (files: AgentDraftAttachment[]) => void;
	onSubmit: () => void;
	onCancel?: () => void;
	disabled?: boolean;
	sending?: boolean;
	catalogName?: string | null;
	selectedSkillName: string | null;
	browserAllowed: boolean;
	onSkillChange: (name: string | null) => void;
	onBrowserAllowedChange: (allowed: boolean) => void;
	onSkillTagClick?: () => void;
};

const ChatInput = ({
	attachments,
	onAttachmentsChange,
	onSubmit,
	onCancel,
	disabled,
	sending,
	catalogName = null,
	selectedSkillName,
	browserAllowed,
	onSkillChange,
	onBrowserAllowedChange,
	onSkillTagClick,
}: Props) => {
	const { draft: value, onDraftChange: onChange } = useChatDraft();
	const { isTauri } = usePlatform();
	const activeSessionId = useChatStore((s) => s.activeSessionId);
	const containerRef = useAutoFocusTextarea(disabled);
	const [fileError, setFileError] = useState<string | null>(null);

	const onFileChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			e.target.value = "";
			if (!file) return;
			try {
				AgentAttachmentStore.assertAttachmentExtension(file.name);
			} catch {
				setFileError(t("agent.input.file-invalid-format"));
				return;
			}
			if (file.size > MAX_ATTACHMENT_SIZE) {
				setFileError(t("agent.input.file-too-large").replace("{{maxSizeMb}}", String(MAX_ATTACHMENT_SIZE_MB)));
				return;
			}
			setFileError(null);
			void serializeAttachments([file]).then((serialized) => {
				onAttachmentsChange(serialized);
			});
		},
		[onAttachmentsChange],
	);

	const removeAttachment = useCallback(
		(index: number) => {
			onAttachmentsChange(attachments.filter((_, i) => i !== index));
		},
		[attachments, onAttachmentsChange],
	);

	const submit = useCallback(() => {
		if (disabled) return;
		if (!value.trim() && attachments.length === 0) return;
		onSubmit();
		setFileError(null);
	}, [attachments.length, disabled, onSubmit, value]);

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

	const hasContent = value.trim().length > 0;
	const isDisabled = sending ? false : !hasContent || disabled;
	const handleClick = sending ? onCancel : submit;
	const sendButtonIcon = sending ? "square" : "arrow-up";

	return (
		<div className="w-full min-w-0">
			{fileError && (
				<Alert className="mb-2" focus="medium" status="error">
					<AlertIcon icon="alert-circle" />
					<AlertDescription>{fileError}</AlertDescription>
					<Tooltip>
						<TooltipTrigger asChild>
							<IconButton
								className="col-start-3 p-0.5 h-5"
								icon="x"
								iconClassName="size-3.5"
								onClick={() => setFileError(null)}
								size="xs"
								status="error"
								variant="ghost"
							/>
						</TooltipTrigger>
						<TooltipContent>{t("agent.tooltips.close")}</TooltipContent>
					</Tooltip>
				</Alert>
			)}
			<div className="w-full flex flex-col py-2 rounded-xl border-primary-border border-[0.5px] bg-background shadow-soft-sm">
				<div className="pl-3.5 pr-2" ref={containerRef}>
					{attachments.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-2">
							{attachments.map((attachment, index) => (
								<Tag
									buttonClassName="hover:bg-status-neutral-bg cursor-default min-w-0 max-w-full overflow-hidden !shadow-none shadow-soft-none hover:!shadow-none hover:shadow-soft-none active:!shadow-none active:shadow-soft-none focus:!shadow-none focus:shadow-soft-none"
									className="min-w-0 max-w-full"
									containerClassName="w-auto min-w-0 max-w-full"
									key={`${attachment.name}-${attachment.size}`}
									onClose={() => removeAttachment(index)}
									size="sm"
									startIcon="paperclip"
								>
									<OverflowTooltip className="truncate h-5 py-1 min-w-0">
										{attachment.name}
									</OverflowTooltip>
								</Tag>
							))}
						</div>
					)}

					<AutogrowTextarea
						autoFocus
						className={cn(
							"min-h-0 p-0 lg:p-0 rounded-none focus:rounded-none text-sm focus:bg-transparent focus:border-transparent w-full resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-0 shadow-none!",
							"shadow-none shadow-soft-none hover:shadow-soft-none focus:shadow-soft-none active:shadow-soft-none invalid:shadow-soft-none aria-[invalid=true]:shadow-soft-none",
							"hover:shadow-none focus:shadow-none active:shadow-none invalid:shadow-none aria-[invalid=true]:shadow-none",
						)}
						key={activeSessionId ?? ""}
						maxRows={12}
						minRows={2}
						onChange={(e) => onChange(e.target.value)}
						onKeyDown={onKeyDown}
						placeholder={t("agent.input.placeholder")}
						value={value}
					/>
				</div>

				<div className="flex justify-between items-center gap-2 pl-2 pr-2">
					<div className="flex min-w-0">
						<div className="shrink-0">
							<ChatToolsMenu
								catalogName={catalogName}
								onFileChange={onFileChange}
								onSkillChange={onSkillChange}
								selectedSkillName={selectedSkillName}
							/>
						</div>

						<div className="shrink-0 ml-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className={cn("inline-block", !isTauri && "cursor-not-allowed")}
										tabIndex={!isTauri ? 0 : undefined}
									>
										<IconButton
											aria-label={t("agent.browser.allow")}
											aria-pressed={browserAllowed}
											className="rounded-full p-1"
											disabled={!isTauri}
											icon="globe"
											iconClassName="size-4"
											onClick={() => onBrowserAllowedChange(!browserAllowed)}
											size="xs"
											status={browserAllowed ? "info" : "default"}
											variant="ghost"
										/>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<TooltipTitle>{t("agent.browser.tooltip-title")}</TooltipTitle>
									<TooltipText className="block">{t("agent.browser.tooltip-text")}</TooltipText>
									{!isTauri && (
										<TooltipText className="block mt-1">
											{t("agent.browser.tooltip-desktop-only")}
										</TooltipText>
									)}
								</TooltipContent>
							</Tooltip>
						</div>

						{selectedSkillName && (
							<div className="flex items-center gap-1 text-primary ml-1 min-w-0">
								<Tag
									buttonClassName="min-w-0 max-w-full overflow-hidden !shadow-none shadow-soft-none hover:!shadow-none hover:shadow-soft-none active:!shadow-none active:shadow-soft-none focus:!shadow-none focus:shadow-soft-none"
									className="min-w-0 max-w-full"
									containerClassName="w-auto min-w-0 max-w-full"
									onClose={() => onSkillChange(null)}
									onLabelClick={onSkillTagClick}
									startIcon="wrench"
									status="info"
								>
									<OverflowTooltip className="truncate h-6 py-1 min-w-0">
										{selectedSkillName}
									</OverflowTooltip>
								</Tag>
							</div>
						)}
					</div>
					<div className="flex items-center gap-3 shrink-0">
						<SessionContextUsage />

						<Tooltip>
							<TooltipTrigger asChild>
								<IconButton
									className="h-auto rounded-full"
									disabled={isDisabled}
									icon={sendButtonIcon}
									iconClassName="h-4 w-4"
									onClick={handleClick}
									size="xs"
								/>
							</TooltipTrigger>
							<TooltipContent>{sending ? t("cancel") : t("send")}</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	);
};

export { ChatInput };
