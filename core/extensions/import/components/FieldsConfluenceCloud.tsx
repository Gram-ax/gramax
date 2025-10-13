import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { FormField } from "@ui-kit/Form";
import { useMemo } from "react";
import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import t from "@ext/localization/locale/translate";
import { ImportModalFormSchema } from "@ext/import/model/ImportModalFormSchema";
import { UseFormReturn } from "react-hook-form";
import { AsyncSearchSelect, AsyncSearchSelectOption } from "@ui-kit/AsyncSearchSelect";
import { useCache } from "@ui-kit/MultiSelect/utils/useCache";

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
				name="space"
				title={t("space")}
				control={({ field }) => (
					<AsyncSearchSelect
						{...field}
						onChange={(option: AsyncSearchSelectOption<FieldsConfluenceCloudValue>) => {
							field.onChange(option);
						}}
						placeholder={t("choose-space")}
						loadOptions={loadOptions}
					/>
				)}
			/>
		</>
	);
};

export default FieldsConfluenceCloud;
