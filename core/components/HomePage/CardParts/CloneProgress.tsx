import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import type { RemoteProgress, RemoteProgressPercentage } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import { ProgressBlockTemplate } from "@ui-kit/Template";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
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

const formatBytes = (data: RemoteProgress): string => {
	if (!data) return "";
	if (data.type !== "chunkedTransfer" && data.type !== "download") return "";

	const bytes = data.data.bytes;

	const speed = formatSpeed(data);
	const formattedSpeed = speed ? ` @ ${speed}` : "";

	if (bytes >= 999 * 1024)
		return ": " + t("git.clone.etc.mb").replace("{}", (bytes / 1024 / 1024).toFixed(2)) + formattedSpeed;
	if (bytes >= 999) return ": " + t("git.clone.etc.kb").replace("{}", (bytes / 1024).toFixed(2)) + formattedSpeed;

	return ": " + t("git.clone.etc.b").replace("{}", bytes.toFixed(2)) + formattedSpeed;
};

const resolveLabelText = (data: RemoteProgress, isBrowser: boolean) => {
	if (!data?.type) return t("git.clone.progress.wait");

	if (data.type === "queue") return t("git.clone.progress.queue");
	if (data.type === "started") return isBrowser ? t("git.clone.progress.downloading") : t("git.clone.progress.wait");
	if (data.type === "finish") return t("git.clone.progress.finish");
	if (
		data.type === "sideband" ||
		data.type === "chunkedTransfer" ||
		data.type === "download" ||
		data.type === "download-no-progress"
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

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={className}>
					{isCancel ? (
						<ProgressBlockTemplate
							indeterminate
							size="sm"
							title={t("git.clone.progress.cancel")}
							data-qa="loader"
						/>
					) : (
						<ProgressBlockTemplate
							data-qa="loader"
							indeterminate={!progress?.percentage}
							size="sm"
							onCancel={setIsCancel ? handleCancel : undefined}
							value={progress?.percentage}
							title={resolveLabelText(progress, isBrowser) + formatBytes(progress)}
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
