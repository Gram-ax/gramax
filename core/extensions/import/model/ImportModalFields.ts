import FieldsConfluenceCloud from "@ext/import/components/FieldsConfluenceCloud";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { UseFormReturn } from "react-hook-form";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { ImportModalFormSchema } from "@ext/import/model/ImportModalFormSchema";

type ImportModalFieldsType = {
	[key in SourceType]?: React.ComponentType<{ sourceData: SourceData; form: UseFormReturn<ImportModalFormSchema> }>;
};

export const importModalFields: ImportModalFieldsType = {
	[SourceType.confluenceCloud]: FieldsConfluenceCloud,
	[SourceType.confluenceServer]: FieldsConfluenceCloud,
	[SourceType.notion]: null,
};
