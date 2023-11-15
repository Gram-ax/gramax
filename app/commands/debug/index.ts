import push from "./git/push";
import reset from "./git/reset";
import status from "./git/status";
import clearLogger from "./logger/clear";
import getLogger from "./logger/get";

const debug = {
	git: {
		status,
		reset,
		push,
	},
	logger: {
		get: getLogger,
		clear: clearLogger,
	},
};

export default debug;
