import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";

interface ConfluenceSourceData extends GitSourceData {
	sourceType: SourceType.confluence;
	cloudId: string;
}

export default ConfluenceSourceData;
