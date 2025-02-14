import getDraft from "@app/commands/mergeRequests/getDraft";
import setApproval from "@app/commands/mergeRequests/setApproval";
import cleanupReferencesDiff from "./cleanupReferencesDiff";
import create from "./create";
import getDiffTree from "./getDiffTree";
import merge from "./merge";
import mountReferencesDiff from "./mountReferencesDiff";

export default {
	merge,
	create,
	getDraft,
	setApproval,
	getDiffTree,
	cleanupReferencesDiff,
	mountReferencesDiff,
};
