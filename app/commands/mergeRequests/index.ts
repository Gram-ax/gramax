import getDraft from "@app/commands/mergeRequests/getDraft";
import setApproval from "@app/commands/mergeRequests/setApproval";
import create from "./create";
import diffItems from "./diffItems";
import merge from "./merge";

export default {
	merge,
	create,
	getDraft,
	setApproval,
	diffItems,
};
