import Icon, { type IconProps } from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import { forwardRef, useCallback } from "react";

const Wrapper = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	justify-content: end;
	flex-direction: column;
	overflow: hidden;
	position: absolute;
	border-radius: var(--radius-large);
`;

const Bar = styled.div<{ progress?: number }>`
	z-index: var(--z-index-base);
	height: 2px;
	width: ${(p) => (p.progress > 0 ? p.progress : 50)}%;
	background-color: var(--color-primary);
	border-radius: var(--radius-large);
	transition: width 0.3s ease-in-out;

	@keyframes loading {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(200%);
		}
	}

	${(p) =>
		!p.progress &&
		css`
			animation: loading 2.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		`}
`;

const Info = styled.div`
	z-index: var(--z-index-base);
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: fit-content;
	width: 100%;
`;

const Cancel = styled(
	forwardRef(
		({ clickable, show, ...props }: { show?: boolean; clickable?: boolean; code: string } & IconProps, ref) => (
			<Icon {...props} ref={ref as any} />
		),
	),
)`
	padding: 0px 4px 0px 0px;
	cursor: ${(p) => (p.clickable ? "pointer" : "default")};
	opacity: ${(p) => (p.clickable ? 1 : 0.5)};

	svg {
		stroke-width: 1.5;
	}
`;

const Label = styled.span`
	gap: 0.3rem;
	width: 100%;
	color: var(--color-primary);
	z-index: var(--z-index-base);
	font-size: 10px;
	padding: 2px 8px;
	font-weight: 400;
	color: var(--color-primary);
	opacity: 0.7;

	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
`;

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

	if (data.type === "sideband" || data.type === "chunkedTransfer" || data.type === "download") {
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
};

const CardCloneProgress = ({ name, percentage, progress, isCancel, setIsCancel }: CardCloneProgressProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isBrowser } = usePlatform();

	const handleCancel = useCallback(async () => {
		if (isCancel || !progress?.cancellable) return;
		const res = await FetchService.fetch(apiUrlCreator.getStorageCloneCancelUrl(name));
		if (res.ok) setIsCancel(true);
	}, [isCancel, progress?.cancellable]);

	return (
		<Wrapper>
			<Info>
				<Tooltip content={collectProgressInfo(progress)}>
					<Label>
						{isCancel
							? t("git.clone.progress.cancel")
							: resolveLabelText(progress, isBrowser) + formatBytes(progress)}
					</Label>
				</Tooltip>

				{progress?.cancellable && (
					<Tooltip content={isCancel ? t("git.clone.progress.cancel") : t("git.clone.cancel")}>
						<Cancel code="x" clickable={!isCancel} onClick={handleCancel} />
					</Tooltip>
				)}
			</Info>
			<Bar data-qa="loader" progress={percentage} />
		</Wrapper>
	);
};

export default CardCloneProgress;
