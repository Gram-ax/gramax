import commit from "./git/commit";
import push from "./git/push";
import reset from "./git/reset";
import status from "./git/status";
import clearLogger from "./logger/clear";
import getLogger from "./logger/get";

const debug = {
	git: {
		status,
		commit,
		reset,
		push,
	},
	logger: {
		get: getLogger,
		clear: clearLogger,
	},
};

export default debug;
