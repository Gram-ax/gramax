import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import type { CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import { ProgressBlockTemplate } from "ics-ui-kit/components/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback } from "react";

const collectProgressInfo = (data: CloneProgress) => {
	if (!data) return;

	if (data.type === "chunkedTransfer") {
		if (data.data.transfer.type === "indexingDeltas") {
			return t("git.clone.indexing-deltas")
				.replace("{indexed}", data.data.transfer.data.indexed)
				.replace("{total}", data.data.transfer.data.total);
		}

		if (data.data.transfer.type === "receivingObjects") {
			return t("git.clone.receiving-objects")
				.replace("{received}", data.data.transfer.data.received)
				.replace("{indexed}", data.data.transfer.data.indexed)
				.replace("{total}", data.data.transfer.data.total);
		}
	}

	if (data.type === "checkout") {
		return t("git.clone.checkout")
			.replace("{checkouted}", data.data.checkouted)
			.replace("{total}", data.data.total);
	}

	if (data.type == "sideband") {
		return data.data.remoteText;
	}
};

const formatSpeed = (data: CloneProgress): string => {
	if (!data) return "";
	if (data.type !== "chunkedTransfer" && data.type !== "download") return "";

	const perSecond = data.data.downloadSpeedBytes;

	if (isNaN(perSecond) || perSecond < 0) {
		return "";
	}

	if (perSecond >= 1024 * 1024) {
		return t("git.clone.etc.mbs").replace("{mbs}", (perSecond / 1024 / 1024).toFixed(2));
	}

	if (perSecond >= 1024) {
		return t("git.clone.etc.kbs").replace("{kbs}", (perSecond / 1024).toFixed(2));
	}

	return t("git.clone.etc.bs").replace("{bs}", perSecond.toFixed(2));
};

const formatBytes = (data: CloneProgress): string => {
	if (!data) return "";
	if (data.type !== "chunkedTransfer" && data.type !== "download") return "";

	const bytes = data.data.bytes;

	if (bytes >= 999 * 1024) {
		return ": " + t("git.clone.etc.mb").replace("{}", (bytes / 1024 / 1024).toFixed(2)) + " @ " + formatSpeed(data);
	}

	if (bytes >= 999) {
		return ": " + t("git.clone.etc.kb").replace("{}", (bytes / 1024).toFixed(2)) + " @ " + formatSpeed(data);
	}

	return ": " + t("git.clone.etc.b").replace("{}", bytes.toFixed(2)) + " @ " + formatSpeed(data);
};

const resolveLabelText = (data: CloneProgress, isBrowser: boolean) => {
	if (!data) return t("git.clone.progress.wait");

	if (data.type === "queue") {
		return t("git.clone.progress.queue");
	}

	if (data.type === "started") {
		return isBrowser ? t("git.clone.progress.downloading") : t("git.clone.progress.wait");
	}

	if (data.type === "finish") {
		return t("git.clone.progress.finish");
	}

	if (
		data.type === "sideband" ||
		data.type === "chunkedTransfer" ||
		data.type === "download" ||
		data.type === "download-no-progress"
	) {
		return t("git.clone.progress.downloading");
	}

	if (data.type === "checkout") {
		return t("git.clone.progress.checkout");
	}
};

export type CardCloneProgressProps = {
	name: string;
	percentage: number;
	progress: CloneProgress;
	isCancel: boolean;
	setIsCancel: (isCancel: boolean) => void;
	className?: string;
};

const CardCloneProgress = (props: CardCloneProgressProps) => {
	const { name, percentage, progress, isCancel, className, setIsCancel } = props;

	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isBrowser } = usePlatform();

	const handleCancel = useCallback(async () => {
		if (isCancel || !progress?.cancellable) return;
		const res = await FetchService.fetch(apiUrlCreator.getStorageCloneCancelUrl(name));
		if (res.ok) setIsCancel(true);
	}, [isCancel, progress?.cancellable]);

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
							indeterminate={!percentage}
							size="sm"
							onCancel={handleCancel}
							value={percentage}
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

export default styled(CardCloneProgress)`
	span {
		font-size: 11px !important;
	}
`;
