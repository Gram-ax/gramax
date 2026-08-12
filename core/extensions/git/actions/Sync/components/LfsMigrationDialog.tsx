import type { ApplyWorkspaceLfsMigrationResult } from "@app/commands/versionControl/lfs/applyWorkspaceLfsMigration";
import type { WorkspaceLfsMigrationStats } from "@app/commands/versionControl/lfs/getWorkspaceLfsMigrationStats";
import DiffContent from "@components/Atoms/DiffContent";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { formatBytes } from "@core-ui/utils/formatBytes";
import type { WorkspaceLfsDivergence } from "@ext/enterprise/lfs/workspaceLfsMigration";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import t from "@ext/localization/locale/translate";
import type { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Skeleton } from "@ui-kit/Skeleton";
import { diffLines } from "diff";
import { type ReactNode, useEffect, useState } from "react";

const toLineHunks = ({ before, after }: { before: string; after: string }): DiffHunk[] =>
	diffLines(before, after).map((c) => ({
		value: c.value,
		type: c.added ? FileStatus.new : c.removed ? FileStatus.delete : undefined,
	}));

// Renders each pattern as inline code, comma-separated: `*.psd`, `*.blend`.
const patternList = (patterns: string[]): ReactNode =>
	patterns.map((pattern, i) => (
		<span key={pattern}>
			{i > 0 && ", "}
			<code data-component="code">{pattern}</code>
		</span>
	));

// A headline count and total size, both lazily loaded — the tree walk behind them can be slow on a
// large catalog, so each number is a skeleton until the stats arrive. `undefined` is still loading;
// `null` means the request failed — the line is dropped rather than spinning skeletons forever, as
// the scale is informational and the migration works without it. Zero files is dropped too: the
// `.gitattributes` change still has to be committed, but "0 files" only confuses.
const AffectedSummary = ({ stats }: { stats?: WorkspaceLfsMigrationStats | null }) => {
	if (stats === null || stats?.fileCount === 0) return null;

	const [head, rest] = t("git.lfs-migration.alert.affected").split("{count}");
	const [middle, tail] = (rest ?? "").split("{size}");
	const value = (text: string | undefined, width: string) =>
		text === undefined ? <Skeleton className={`inline-block h-4 ${width} align-middle`} /> : text;

	return (
		<p className="font-medium">
			{head}
			{value(stats ? String(stats.fileCount) : undefined, "w-8")}
			{middle}
			{value(stats ? formatBytes(stats.totalSize, 1) : undefined, "w-16")}
			{tail}
		</p>
	);
};

// Which patterns move in each direction, as one sentence. `.gitattributes` and every pattern are
// set as inline code so they read as the file names and masks they are.
const DetailsAttributes = ({ added, removed }: { added: string[]; removed: string[] }) => {
	const parts: ReactNode[] = [];
	if (added.length) {
		parts.push(
			<span key="added">
				{t("git.lfs-migration.alert.details-added")} {patternList(added)}
			</span>,
		);
	}
	if (removed.length) {
		parts.push(
			<span key="removed">
				{t("git.lfs-migration.alert.details-removed")} {patternList(removed)}
			</span>,
		);
	}

	const [lead, tail] = t("git.lfs-migration.alert.details-lead").split("{file}");

	return (
		<p className="text-muted text-sm">
			{lead}
			<code data-component="code">.gitattributes</code>
			{tail}
			{parts.map((part, i) => (
				<span key={i === 0 ? "first" : "second"}>
					{i > 0 && ", "}
					{part}
				</span>
			))}
			.
		</p>
	);
};

export interface LfsMigrationDialogProps {
	apiUrlCreator: ApiUrlCreator;
	fileDiff?: WorkspaceLfsDivergence["fileDiff"];
	added: string[];
	removed: string[];
	// Called once the flow has settled: `true` after the apply fetch has finished (regardless of
	// its own ok/error outcome — errors surface via the fetch's default notifyError), `false` when
	// the user dismissed the dialog (Later / Escape) without migrating. `mergeData` carries the
	// result of the pull the apply does first — the caller opens the merge resolver on conflicts.
	onSettled: (migrated: boolean, mergeData?: MergeData) => void;
}

const LfsMigrationDialog = ({ apiUrlCreator, fileDiff, added, removed, onSettled }: LfsMigrationDialogProps) => {
	const [open, setOpen] = useState(true);
	const [migrating, setMigrating] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	// Walking the HEAD tree can take a while on a large catalog, so the dialog opens right away and
	// fills the numbers in when they arrive. `undefined` is still loading, `null` is a failed request
	// — both handled by `AffectedSummary`. The fetch keeps `notifyError` off (a stats failure must not
	// raise the global error dialog), so the failure is surfaced by dropping the line, not spinning.
	const [affected, setAffected] = useState<WorkspaceLfsMigrationStats | null | undefined>(undefined);

	useEffect(() => {
		let alive = true;
		void (async () => {
			const res = await FetchService.fetch<WorkspaceLfsMigrationStats>(
				apiUrlCreator.getWorkspaceLfsMigrationStats(),
				undefined,
				MimeTypes.text,
				Method.POST,
				false,
			);
			if (!alive) return;
			if (!res.ok) {
				setAffected(null);
				return;
			}
			const stats = await res.json();
			if (alive) setAffected(stats);
		})();
		return () => {
			alive = false;
		};
	}, [apiUrlCreator]);

	const handleDismiss = () => {
		if (migrating) return;
		setOpen(false);
		onSettled(false);
	};

	const handleMigrate = async () => {
		setMigrating(true);
		const res = await FetchService.fetch<ApplyWorkspaceLfsMigrationResult>(
			apiUrlCreator.applyWorkspaceLfsMigration(),
		);
		onSettled(true, res.ok ? (await res.json()).mergeData : undefined);
	};

	const onOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			handleDismiss();
			return;
		}
		setOpen(nextOpen);
	};

	const onEscapeKeyDown = (event: Event) => {
		if (migrating) event.preventDefault();
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent onEscapeKeyDown={onEscapeKeyDown}>
				<AlertDialogHeader className="grid grid-cols-[0_1fr] items-start gap-y-4 has-[>svg]:grid-cols-[1.5rem_1fr] has-[>svg]:gap-x-4">
					<AlertDialogIcon icon="cloud-upload" />
					<AlertDialogTitle className="col-start-2 mb-0 text-left">
						{t(`git.lfs-migration.alert.${migrating ? "migrating" : "title"}`)}
					</AlertDialogTitle>
					<AlertDialogDescription asChild className="col-start-2 text-left">
						<div className="flex flex-col gap-3">
							<p>{t("git.lfs-migration.alert.body")}</p>

							<AffectedSummary stats={affected} />

							{fileDiff && (
								<Collapsible onOpenChange={setDetailsOpen} open={detailsOpen}>
									<CollapsibleTrigger asChild>
										<Button
											className="text-muted-foreground h-auto p-0 text-sm font-normal"
											endIcon={detailsOpen ? "chevron-up" : "chevron-down"}
											size="sm"
											variant="link"
										>
											{t("git.lfs-migration.alert.details-trigger")}
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent className="flex flex-col gap-2">
										<DetailsAttributes added={added} removed={removed} />
										<p className="text-muted text-sm">
											{t("git.lfs-migration.alert.details-directions")}
										</p>
										<div className="max-h-64 overflow-auto rounded-md border p-2 text-sm">
											<DiffContent changes={toLineHunks(fileDiff)} isCode showDiff />
										</div>
									</CollapsibleContent>
								</Collapsible>
							)}

							{!migrating && (
								<p className="text-muted-foreground text-sm">{t("git.lfs-migration.alert.footnote")}</p>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				{/* The ui-kit footer only stacks below the `sm` viewport breakpoint, but the dialog can be
				    narrow while the window is wide. Labels never break mid-word: the buttons keep their
				    text on one line and wrap onto separate rows instead. */}
				<AlertDialogFooter className="flex-wrap gap-2 sm:justify-end sm:space-x-0">
					<Button
						className="whitespace-nowrap"
						disabled={migrating}
						onClick={handleDismiss}
						variant="outline"
					>
						{t("git.lfs-migration.alert.later")}
					</Button>
					{migrating ? (
						<LoadingButtonTemplate
							className="whitespace-nowrap"
							text={t("git.lfs-migration.alert.migrate")}
							variant="primary"
						/>
					) : (
						<Button className="whitespace-nowrap" onClick={handleMigrate} variant="primary">
							{t("git.lfs-migration.alert.migrate")}
						</Button>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default LfsMigrationDialog;
