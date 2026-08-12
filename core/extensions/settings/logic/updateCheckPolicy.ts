// The frequency itself is a user setting ("updates.check-frequency" in the
// AppSettings schema); this module only owns the interval gating and the
// last-check timestamp. The timestamp is runtime state, not a user setting —
// it stays in localStorage and never goes to config.yaml.
export enum UpdateCheckFrequency {
	EveryLaunch = "every-launch",
	Daily = "daily",
	Weekly = "weekly",
	Never = "never",
}

const LAST_CHECK_KEY = "last-update-check";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

// "Every launch" keeps a short interval so windows opened within one launch share a single check.
const CHECK_INTERVALS: Record<Exclude<UpdateCheckFrequency, UpdateCheckFrequency.Never>, number> = {
	[UpdateCheckFrequency.EveryLaunch]: 15 * MINUTE,
	[UpdateCheckFrequency.Daily]: DAY,
	[UpdateCheckFrequency.Weekly]: 7 * DAY,
};

export const shouldAutoCheckUpdates = (frequency: UpdateCheckFrequency): boolean => {
	if (frequency === UpdateCheckFrequency.Never) return false;
	const interval = CHECK_INTERVALS[frequency] ?? CHECK_INTERVALS[UpdateCheckFrequency.EveryLaunch];
	const lastCheck = Number(window.localStorage.getItem(LAST_CHECK_KEY) ?? 0);
	return Date.now() - lastCheck > interval;
};

export const markUpdateCheck = () => {
	window.localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
};
