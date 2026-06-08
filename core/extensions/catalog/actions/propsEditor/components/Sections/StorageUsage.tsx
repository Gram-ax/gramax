import Icon from "@components/Atoms/Icon";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { formatBytes } from "@core-ui/utils/formatBytes";
import styled from "@emotion/styled";
import type { StorageStats } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";
import { Counter } from "@ui-kit/Counter";
import { Loader } from "@ui-kit/Loader";
import { Skeleton } from "@ui-kit/Skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ReactNode, useState } from "react";

type HelpIconProps = {
	content: ReactNode;
};

type GroupRowProps = {
	label: string;
	size?: number;
	action?: ReactNode;
};

type ChildRowProps = {
	label: string;
	tooltip: ReactNode;
	count?: number;
	size?: number;
	muted?: boolean;
	isLast?: boolean;
};

type CleanupButtonProps = {
	onClick: () => void;
	disabled: boolean;
	loading: boolean;
};

const TreeLabel = styled.span<{ isLast?: boolean }>`
	background-image: linear-gradient(to bottom, var(--color-border) 0 100%),
		linear-gradient(to right, var(--color-border) 0 100%);
	background-position: 0.4em 0, 0.4em ${({ isLast }) => (isLast ? "50%" : "0")};
	background-size: 1px ${({ isLast }) => (isLast ? "50%" : "100%")}, 0.5em 1px;
	background-repeat: no-repeat;
`;

const HelpIcon = ({ content }: HelpIconProps) => (
	<Tooltip>
		<TooltipTrigger>
			<Icon className="text-muted shrink-0" code="circle-help" size="0.95em" />
		</TooltipTrigger>
		<TooltipContent>{content}</TooltipContent>
	</Tooltip>
);

const SizeSkeleton = () => <Skeleton className="h-5 w-16 rounded" />;
const CountSkeleton = () => <Skeleton className="h-5 w-8 rounded" />;

const GroupRow = ({ label, size, action }: GroupRowProps) => (
	<div className="flex items-center justify-between py-2 px-1">
		<span className="flex items-center gap-1.5 text-sm font-medium">{label}</span>
		<div className="flex items-center gap-2">
			{action}
			{size === undefined ? <SizeSkeleton /> : <span className="text-sm">{formatBytes(size)}</span>}
		</div>
	</div>
);

const ChildRow = ({ label, tooltip, count, size, muted, isLast }: ChildRowProps) => {
	const isLoading = count === undefined || size === undefined;
	return (
		<div className="flex items-center justify-between py-1.5 pr-1">
			<TreeLabel
				className={`flex items-center gap-1.5 text-sm pl-4 relative ${muted ? "text-muted" : ""}`}
				isLast={isLast}
			>
				{label}
				<HelpIcon content={tooltip} />
			</TreeLabel>
			<div className="flex items-center gap-1.5">
				{isLoading ? (
					<>
						<CountSkeleton />
						<SizeSkeleton />
					</>
				) : (
					<>
						{count > 0 && (
							<Counter className={muted ? "opacity-70" : ""} variant="outline">
								{count}
							</Counter>
						)}
						<span className="text-sm">{formatBytes(size)}</span>
					</>
				)}
			</div>
		</div>
	);
};

const CleanupButton = ({ onClick, disabled, loading }: CleanupButtonProps) => (
	<Button disabled={disabled || loading} onClick={onClick} size="xs" type="button" variant="outline">
		{loading ? <Loader size="sm" /> : <Icon code="eraser" size="0.9em" />}
		{t("storage-stats.cleanup")}
	</Button>
);

export const StorageUsage = () => {
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const [confirmAction, setConfirmAction] = useState<"gc" | "lfs" | null>(null);

	const {
		call: fetchStats,
		data: stats,
		status,
		error: statsError,
		reset: resetStats,
	} = useApi<StorageStats>({
		url: (api) => api.getStorageStats(catalogName),
		opts: { consumeError: true },
		auto: true,
	});

	const { call: runGc, status: runGcStatus } = useApi({
		url: (api) => api.runGc({ looseObjectsLimit: 1, packFilesLimit: 1 }),
		onDone: async () => {
			resetStats();
			await fetchStats();
		},
	});

	const { call: lfsPrune, status: lfsPruneStatus } = useApi({
		url: (api) => api.lfsPrune(),
		onDone: async () => {
			resetStats();
			await fetchStats();
		},
	});

	const isLoading = !stats && (status === RequestStatus.Loading || status === RequestStatus.Init);
	const isError = status === RequestStatus.Error;

	const gitTotal = stats
		? stats.looseObjects.size + stats.looseObjects.unreachableSize + stats.packFiles.size
		: undefined;
	const lfsTotal = stats ? stats.lfsObjects.size + stats.lfsObjects.prunableSize : undefined;

	const gitCleanableCount = (stats?.looseObjects.unreachableCount ?? 0) + (stats?.looseObjects.count ?? 0);
	const lfsCleanableCount = stats?.lfsObjects.prunableCount ?? 0;

	const isGitRunning = runGcStatus === RequestStatus.Loading;
	const isLfsRunning = lfsPruneStatus === RequestStatus.Loading;

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
				<Icon className="text-muted" code="triangle-alert" size="1.5em" />
				<span className="text-sm font-medium">{t("storage-stats.error")}</span>
				{statsError?.message && <span className="text-xs text-muted">{statsError.message}</span>}
				<Button onClick={fetchStats} size="xs" type="button" variant="outline">
					{t("storage-stats.retry")}
				</Button>
			</div>
		);
	}

	const handleConfirm = () => {
		const action = confirmAction;
		setConfirmAction(null);
		if (action === "gc") void runGc();
		else if (action === "lfs") void lfsPrune();
	};

	return (
		<>
			<div className="flex flex-col">
				<GroupRow
					action={
						<CleanupButton
							disabled={isLoading || isError || gitCleanableCount === 0}
							loading={isGitRunning}
							onClick={() => setConfirmAction("gc")}
						/>
					}
					label={t("storage-stats.git")}
					size={gitTotal}
				/>
				<ChildRow
					count={stats?.looseObjects.count}
					label={t("storage-stats.loose-objects")}
					size={stats?.looseObjects.size}
					tooltip={t("storage-stats.tooltips.loose-objects")}
				/>
				<ChildRow
					count={stats?.looseObjects.unreachableCount}
					label={t("storage-stats.unreachable")}
					size={stats?.looseObjects.unreachableSize}
					tooltip={t("storage-stats.tooltips.unreachable")}
				/>
				<ChildRow
					count={stats?.packFiles.count}
					isLast
					label={t("storage-stats.pack-files")}
					size={stats?.packFiles.size}
					tooltip={t("storage-stats.tooltips.pack-files")}
				/>
			</div>

			<div className="flex flex-col">
				<GroupRow
					action={
						<CleanupButton
							disabled={isLoading || isError || lfsCleanableCount === 0}
							loading={isLfsRunning}
							onClick={() => setConfirmAction("lfs")}
						/>
					}
					label={t("storage-stats.lfs")}
					size={lfsTotal}
				/>
				<ChildRow
					count={stats?.lfsObjects.prunableCount}
					label={t("storage-stats.prunable")}
					size={stats?.lfsObjects.prunableSize}
					tooltip={t("storage-stats.tooltips.prunable")}
				/>
				<ChildRow
					count={stats?.lfsObjects.count}
					isLast
					label={t("storage-stats.lfs-objects")}
					size={stats?.lfsObjects.size}
					tooltip={t("storage-stats.tooltips.lfs")}
				/>
			</div>

			<AlertDialog onOpenChange={(open) => !open && setConfirmAction(null)} open={confirmAction !== null}>
				<AlertDialogContent status="warning">
					<AlertDialogHeader>
						<AlertDialogIcon icon="alert-circle" />
						<AlertDialogTitle>{t("storage-stats.confirm.title")}</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmAction === "gc" ? t("storage-stats.confirm.git") : t("storage-stats.confirm.lfs")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel variant="outline">{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirm} variant="primary">
							{t("storage-stats.cleanup")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
