import commit from "./git/commit";
import push from "./git/push";
import reset from "./git/reset";
import status from "./git/status";

const debug = {
	git: {
		status,
		commit,
		reset,
		push,
	},
};

export default debug;
