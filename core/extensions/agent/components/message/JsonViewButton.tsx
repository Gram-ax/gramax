import FileInput from "@components/Atoms/FileInput/FileInput";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Button, IconButton } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@ui-kit/Dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type MouseEvent, useEffect, useRef, useState } from "react";

const CONTENT_KEYS_RE = /"(content|reasoning_content|arguments)": "((?:[^"\\]|\\.)*)"/g;

const expandContentNewlines = (json: string): string => {
	return json.replace(CONTENT_KEYS_RE, (_, key, value: string) => `"${key}": "${value.replace(/\\n/g, "\n")}"`);
};

interface JsonMonacoProps {
	value: string;
	height: string;
	fullscreen: boolean;
	onToggleFullscreen: () => void;
}

const JsonMonaco = ({ value, height, fullscreen, onToggleFullscreen }: JsonMonacoProps) => {
	const restoreRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		return () => restoreRef.current?.();
	}, []);

	return (
		<div className="group relative h-full w-full overflow-hidden rounded-lg border border-secondary-border shadow-soft-sm">
			<Tooltip>
				<TooltipTrigger asChild>
					<IconButton
						aria-label={t(fullscreen ? "agent.collapse" : "agent.expand")}
						className="absolute right-2 top-2 z-10 bg-[var(--color-article-bg)] opacity-0 shadow-soft-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
						icon={fullscreen ? "minimize-2" : "maximize-2"}
						onClick={onToggleFullscreen}
						size="xs"
						variant="ghost"
					/>
				</TooltipTrigger>
				<TooltipContent>{t(fullscreen ? "agent.collapse" : "agent.expand")}</TooltipContent>
			</Tooltip>
			<FileInput
				height={height}
				language="json"
				onMount={(_, monaco) => {
					const prev = monaco.languages.json.jsonDefaults.diagnosticsOptions;
					monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: false });
					restoreRef.current = () => monaco.languages.json.jsonDefaults.setDiagnosticsOptions(prev);
				}}
				options={{ folding: true, minimap: { enabled: false }, readOnly: true }}
				style={{ padding: "0" }}
				theme={{ dark: "new-vs-dark", light: "light" }}
				value={value}
			/>
		</div>
	);
};

interface JsonViewButtonProps {
	source: unknown;
	inline?: boolean;
	className?: string;
}

export const JsonViewButton = ({ source, inline, className }: JsonViewButtonProps) => {
	const [open, setOpen] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
	const text = typeof source === "string" ? source : JSON.stringify(source, null, 2);

	const handleOpen = (e: MouseEvent) => {
		e.stopPropagation();
		setOpen(true);
	};

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					{inline ? (
						<IconButton
							aria-label={t("agent.view-json")}
							className={cn(
								"size-5 p-1 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100",
								className,
							)}
							icon="braces"
							onClick={handleOpen}
							size="xs"
							variant="ghost"
						/>
					) : (
						<Button
							className="h-6 shrink-0 gap-1.5 px-2"
							onClick={handleOpen}
							size="xs"
							startIcon="braces"
							variant="outline"
						>
							JSON
						</Button>
					)}
				</TooltipTrigger>
				<TooltipContent>{t("agent.view-json")}</TooltipContent>
			</Tooltip>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent size={fullscreen ? "FS" : undefined}>
					<DialogHeader>
						<DialogTitle>JSON</DialogTitle>
					</DialogHeader>
					<DialogBody className="min-h-0 overflow-hidden">
						<JsonMonaco
							fullscreen={fullscreen}
							height={fullscreen ? "calc(95vh - 8rem)" : "60vh"}
							onToggleFullscreen={() => setFullscreen((f) => !f)}
							value={expandContentNewlines(text)}
						/>
					</DialogBody>
				</DialogContent>
			</Dialog>
		</>
	);
};
