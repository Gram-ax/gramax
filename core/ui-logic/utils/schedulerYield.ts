const scheduler = globalThis.scheduler as { yield?: () => Promise<void> } | undefined;

const schedulerYield = async () => {
	if (scheduler && "yield" in scheduler && typeof scheduler.yield === "function") {
		await scheduler.yield();
	} else {
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
};

export default schedulerYield;
