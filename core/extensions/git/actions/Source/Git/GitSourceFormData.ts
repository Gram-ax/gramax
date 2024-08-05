import GitSourceData from "@ext/git/core/model/GitSourceData.schema";

interface GitSourceFormData extends GitSourceData {
	url?: string;
}

export default GitSourceFormData;
