import Path from "@core/FileProvider/Path/Path";

const MARK_TTL_MS = 10_000;

const pendingMap = new Map<string, ReturnType<typeof setTimeout>>();

const markWithTtl = (absPath: string, ttlMs: number): void => {
	clearTimeout(pendingMap.get(absPath));
	pendingMap.set(
		absPath,
		setTimeout(() => pendingMap.delete(absPath), ttlMs),
	);
};

export const PendingSelfWrites = {
	mark(absPath: string): void {
		markWithTtl(absPath, MARK_TTL_MS);
	},
	markWithTtl,
	covers(absPath: string): boolean {
		for (let path = new Path(absPath); path.value; path = path.parentDirectoryPath) {
			if (pendingMap.has(path.value)) return true;
		}
		return false;
	},
	clearAll(): void {
		for (const timer of pendingMap.values()) clearTimeout(timer);
		pendingMap.clear();
	},
};
