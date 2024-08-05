import ShareData from "../../../catalog/actions/share/model/ShareData";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";

export default interface GitShareData extends ShareData {
	domain: string;
	group: string;
	branch: string;
	protocol?: string;
	sourceType: SourceType.git | SourceType.gitHub | SourceType.gitLab;
}
