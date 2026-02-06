import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { ImportModalFormSchema } from "@ext/import/model/ImportModalFormSchema";
import t from "@ext/localization/locale/translate";
import { AsyncSearchSelect, AsyncSearchSelectOption } from "@ui-kit/AsyncSearchSelect";
import { FormField } from "@ui-kit/Form";
import { useCache } from "@ui-kit/MultiSelect/utils/useCache";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

interface FieldsConfluenceCloudProps {
	sourceData: ConfluenceSourceData;
	form: UseFormReturn<ImportModalFormSchema>;
}

type FieldsConfluenceCloudValue = {
	label: string;
	value: string;
	displayName: string;
};

const FieldsConfluenceCloud = ({ sourceData }: FieldsConfluenceCloudProps) => {
	const pageProps = PageDataContextService.value;
	const api = useMemo(
		() => makeSourceApi(sourceData, pageProps.conf.authServiceUrl) as ConfluenceAPI,
		[pageProps?.conf?.authServiceUrl, sourceData],
	);

	const { loadOptions } = useCache(async (params) => {
		const spaces = await api.getSpaces({
			type: "space",
			title: params.searchQuery.length > 0 ? params.searchQuery : undefined,
			orderBy: "lastModified",
			sortDirection: "desc",
		});

		return spaces.map((space) => ({
			value: space.id,
			label: space.name,
			displayName: space.name,
		}));
	});

	return (
		<>
			<FormField
				control={({ field }) => (
					<AsyncSearchSelect
						{...field}
						loadOptions={loadOptions}
						onChange={(option: AsyncSearchSelectOption<FieldsConfluenceCloudValue>) => {
							field.onChange(option);
						}}
						placeholder={t("choose-space")}
					/>
				)}
				name="space"
				title={t("space")}
			/>
		</>
	);
};

export default FieldsConfluenceCloud;
