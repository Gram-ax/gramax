import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

export default interface NotionSourceData extends SourceData {
	sourceType: SourceType.notion;
	workspaceName: string;
	workspaceId: string;
	token: string;
}
