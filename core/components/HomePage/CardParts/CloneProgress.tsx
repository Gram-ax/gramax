import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import type { RemoteProgress, RemoteProgressPercentage } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Progress } from "@ui-kit/Progress";
import { Tooltip, TooltipContent, TooltipTrigger, useOverflowTooltip } from "@ui-kit/Tooltip";
import { useCallback } from "react";

const collectProgressInfo = (data: RemoteProgress) => {
	if (!data) return "";

	if (data.type === "chunkedTransfer") {
		if (data.data.transfer.type === "indexingDeltas")
			return t("git.clone.indexing-deltas")
				.replace("{indexed}", data.data.transfer.data.indexed)
				.replace("{total}", data.data.transfer.data.total);

		if (data.data.transfer.type === "receivingObjects")
			return t("git.clone.receiving-objects")
				.replace("{received}", data.data.transfer.data.received)
				.replace("{indexed}", data.data.transfer.data.indexed)
				.replace("{total}", data.data.transfer.data.total);
	}

	if (data.type === "checkout")
		return t("git.clone.checkout")
			.replace("{checkouted}", data.data.checkouted)
			.replace("{total}", data.data.total);

	if (data.type == "sideband") return data.data.remoteText;
};

const formatSpeed = (data: RemoteProgress): string => {
	if (!data) return "";
	if (data.type !== "chunkedTransfer" && data.type !== "download") return "";

	const perSecond = data.data.downloadSpeedBytes;

	if (isNaN(perSecond) || perSecond <= 0) return "";
	if (perSecond >= 1024 * 1024) return t("git.clone.etc.mbs").replace("{mbs}", (perSecond / 1024 / 1024).toFixed(2));
	if (perSecond >= 1024) return t("git.clone.etc.kbs").replace("{kbs}", (perSecond / 1024).toFixed(2));
	return t("git.clone.etc.bs").replace("{bs}", perSecond.toFixed(2));
};

const formatCollectedBytes = (data: RemoteProgress): string => {
	if (!data) return "";
	if (data.type !== "chunkedTransfer" && data.type !== "download") return "";

	const bytes = data.data.bytes;

	if (bytes >= 999 * 1024) return t("git.clone.etc.mb").replace("{}", (bytes / 1024 / 1024).toFixed(2));
	if (bytes >= 999) return t("git.clone.etc.kb").replace("{}", (bytes / 1024).toFixed(2));

	return t("git.clone.etc.b").replace("{}", bytes.toFixed(2));
};

const resolveLabelText = (data: RemoteProgress, isBrowser: boolean) => {
	if (!data?.type) return t("git.clone.progress.wait");

	if (data.type === "queue") return t("git.clone.progress.queue");
	if (data.type === "started") return isBrowser ? t("git.clone.progress.downloading") : t("git.clone.progress.wait");
	if (data.type === "finish") return t("git.clone.progress.finish");
	if (
		isBrowser &&
		(data.type === "sideband" ||
			data.type === "chunkedTransfer" ||
			data.type === "download" ||
			data.type === "download-no-progress")
	)
		return t("git.clone.progress.downloading");

	if (data.type === "checkout") return t("git.clone.progress.checkout");

	return "";
};

export type CloneProgressProps = {
	name: string;
	progress: RemoteProgressPercentage;
	isCancel?: boolean;
	setIsCancel?: (isCancel: boolean) => void;
	className?: string;
};

interface ProgressBlockProps {
	title: string;
	speed?: string;
	indeterminate?: boolean;
	value?: number;
	onCancel?: () => void;
}

const ProgressBlock = ({ indeterminate, title, onCancel, value, speed }: ProgressBlockProps) => {
	const { open, onOpenChange, ref } = useOverflowTooltip<HTMLDivElement>();

	return (
		<div className="flex w-full flex-col gap-1 max-w-full overflow-hidden">
			<div className="flex items-center gap-2 justify-between">
				<div className="flex items-center justify-between gap-1" style={{ maxWidth: "85%" }}>
					<div className="text-xs text-primary-fg font-normal whitespace-nowrap">{title}</div>
					{speed && (
						<>
							<Divider orientation="vertical" className="h-3" />
							<Tooltip open={open} onOpenChange={onOpenChange}>
								<TooltipTrigger asChild>
									<div className="text-xs truncate text-primary-fg font-normal" ref={ref}>
										{speed}
									</div>
								</TooltipTrigger>
								<TooltipContent>{`${title} / ${speed}`}</TooltipContent>
							</Tooltip>
						</>
					)}
				</div>
				<div className="flex items-center w-full justify-end">
					{onCancel && (
						<IconButton
							size="sm"
							variant="text"
							onClick={onCancel}
							icon="x"
							style={{ padding: "0", height: "auto" }}
						/>
					)}
				</div>
			</div>
			<Progress indeterminate={indeterminate} value={value} size="sm" />
		</div>
	);
};

const CloneProgress = (props: CloneProgressProps) => {
	const { name, progress, isCancel, setIsCancel, className } = props;

	const { call: cancelClone } = useApi({
		url: (api) => api.cancelClone(name),
	});

	const { isBrowser } = usePlatform();

	const handleCancel = useCallback(async () => {
		if (!setIsCancel || isCancel || !progress?.cancellable) return;

		await cancelClone();
	}, [setIsCancel, cancelClone, isCancel, progress?.cancellable]);

	const tooltipContent = collectProgressInfo(progress);

	const title = resolveLabelText(progress, isBrowser) || formatCollectedBytes(progress);
	const speed = isBrowser ? undefined : formatSpeed(progress);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={className} style={{ marginBottom: "-4px" }}>
					{isCancel ? (
						<ProgressBlock indeterminate title={t("git.clone.progress.cancel")} />
					) : (
						<ProgressBlock
							indeterminate={!progress?.percentage}
							title={title}
							speed={speed}
							value={progress?.percentage}
							onCancel={handleCancel}
						/>
					)}
				</div>
			</TooltipTrigger>
			{tooltipContent && (
				<TooltipContent>
					<div>{tooltipContent}</div>
				</TooltipContent>
			)}
		</Tooltip>
	);
};

export default styled(CloneProgress)`
	span {
		font-size: 11px !important;
	}

	width: 100%;
`;
