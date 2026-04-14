/* global process */

const isProduction = () =>
	process.env.PRODUCTION === "true" &&
	process.env.CI_COMMIT_BRANCH !== "develop" &&
	process.env.CI_PIPELINE_SOURCE !== "merge_request_event" 

export default isProduction;
