import getDraft from "@app/commands/mergeRequests/getDraft";
import setApproval from "@app/commands/mergeRequests/setApproval";
import create from "./create";
import deleteMr from "./deleteMr";
import merge from "./merge";

export default {
	merge,
	create,
	getDraft,
	setApproval,
	deleteMr,
};
