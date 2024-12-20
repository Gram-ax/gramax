import FileProvider from "@core/FileProvider/model/FileProvider";
import ConfluenceCloudConverter from "@ext/confluence/core/cloud/logic/ConfluenceCloudConverter";
import ConfluenceServerConverter from "@ext/confluence/core/server/logic/ConfluenceServerConverter";
import ConfluenceConverter from "@ext/confluence/core/model/ConfluenceConverter";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

type IncludeTypes<T> = T extends SourceType.confluenceCloud | SourceType.confluenceServer ? T : never;

type ConfluenceSourceType = IncludeTypes<SourceType>;

const makeConfluenceConvertor: Record<
	ConfluenceSourceType,
	(data: ConfluenceSourceData, fp: FileProvider) => ConfluenceConverter
> = {
	"Confluence Cloud": (data, fp) => new ConfluenceCloudConverter(data as ConfluenceCloudSourceData, fp),
	"Confluence self-hosted server": (data, fp) =>
		new ConfluenceServerConverter(data as ConfluenceServerSourceData, fp),
};

export default makeConfluenceConvertor;
