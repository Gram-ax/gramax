import { z } from "zod";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import t from "@ext/localization/locale/translate";

export const getImportModalFormSchema = (sourceDatas?: any) => {
	return z
		.object({
			sourceKey: z.string({ message: t("import.error.source-required") }),
			space: z.object({
				value: z.string(),
				label: z.string(),
				displayName: z.string(),
			}),
		})
		.superRefine((data, ctx) => {
			const sourceData =
				sourceDatas && data.sourceKey && data.sourceKey !== "add-new-storage"
					? getSourceDataByStorageName(data.sourceKey, sourceDatas)
					: null;

			const requiresSpaceAndDisplayName =
				sourceData?.sourceType === SourceType.confluenceCloud ||
				sourceData?.sourceType === SourceType.confluenceServer;

			if (requiresSpaceAndDisplayName && (!data.space || !data.space.displayName)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t("import.error.space-required"),
					path: ["space"],
				});
			}
		});
};

export type ImportModalFormSchema = z.infer<ReturnType<typeof getImportModalFormSchema>>;
