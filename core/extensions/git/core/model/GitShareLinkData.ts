import ShareLinkData from "../../../catalog/actions/share/model/ShareLinkData";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";

export default interface GitShareLinkData extends ShareLinkData {
	group: string;
	domain: string;
	branch: string;
	sourceType: SourceType.enterprise | SourceType.gitHub | SourceType.gitLab;
}
