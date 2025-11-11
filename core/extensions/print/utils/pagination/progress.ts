import { PdfExportProgress } from "@ext/print/types";

export type ProgressReporter = (progress: PdfExportProgress) => void;

export interface ProgressTrackerOptions {
	totalUnits: number;
	reporter?: ProgressReporter;
	countPrintPages?: () => number;
	startRatio?: number;
	maxRatio?: number;
	throttleUnits?: number;
}

export interface ProgressTracker {
	readonly ratio: number;
	increase(delta?: number, force?: boolean): void;
	emit(force?: boolean): void;
}

export const createProgressTracker = ({
	totalUnits,
	reporter,
	countPrintPages,
	startRatio = 0.05,
	maxRatio = 0.99,
	throttleUnits,
}: ProgressTrackerOptions): ProgressTracker => {
	let processed = 0;
	let lastReported = -1;
	const threshold = throttleUnits || Math.max(1, Math.floor(totalUnits / 100));

	const calcRatio = () => {
		if (totalUnits === 0) return 1;
		const base = Math.min(processed / totalUnits, 1);
		const scaled = startRatio + base * (maxRatio - startRatio);
		return Math.min(scaled, maxRatio);
	};

	const emit = (force = false) => {
		if (!reporter) return;
		const ratio = calcRatio();
		if (!force && processed === lastReported) return;
		reporter({
			stage: "exporting",
			ratio,
			...(countPrintPages
				? { cliMessage: `done-print-element-${processed}/${totalUnits}|-pages-${countPrintPages()}` }
				: {}),
		});
		lastReported = processed;
	};

	return {
		get ratio() {
			return totalUnits === 0 ? 1 : Math.min(processed / totalUnits, 1);
		},
		increase(delta = 1, force = false) {
			if (totalUnits === 0) {
				emit(true);
				return;
			}
			const next = Math.min(processed + delta, totalUnits);
			processed = next;
			const shouldEmit = force || processed === totalUnits || processed - lastReported >= threshold;
			if (shouldEmit) emit(force);
		},
		emit(force = false) {
			emit(force);
		},
	};
};
