import ShareData from "../../../catalog/actions/share/model/ShareData";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";

export default interface GitShareData extends ShareData {
	group: string;
	domain: string;
	branch: string;
	sourceType: SourceType.enterprise | SourceType.gitHub | SourceType.gitLab;
}
