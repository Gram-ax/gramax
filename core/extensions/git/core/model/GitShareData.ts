import GitSourceType from "@ext/git/core/model/GitSourceType";
import ShareData from "../../../catalog/actions/share/model/ShareData";

export default interface GitShareData extends ShareData {
	domain: string;
	group: string;
	branch: string;
	protocol?: string;
	sourceType: GitSourceType;
}
