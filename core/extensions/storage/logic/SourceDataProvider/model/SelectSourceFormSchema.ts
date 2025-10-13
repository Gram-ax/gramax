import { GithubUserType } from "@ext/git/actions/Source/GitHub/model/GithubStorageData";
import t from "@ext/localization/locale/translate";
import { z } from "zod";

const SourceKeySchema = z.string({
	message: t("forms.clone-repo.errors.sourceKey"),
});

const UserSchema = z.object(
	{
		name: z.string(),
		htmlUrl: z.string(),
		avatarUrl: z.string(),
		type: z.enum(Object.values(GithubUserType) as [string, ...string[]]),
	},
	{
		message: t("forms.clone-repo.errors.user"),
	},
);

const RepositorySchema = z.object(
	{
		path: z.string(),
		lastActivity: z.string().optional(),
	},
	{
		message: t("forms.clone-repo.errors.repository"),
	},
);

export const getSelectStorageFormSchema = (mode: "init" | "clone") =>
	mode === "clone"
		? z
				.object({
					sourceKey: SourceKeySchema,
					repository: RepositorySchema,
					user: UserSchema.optional(),
					group: z.null().optional(),
				})
				.or(
					z.object({
						sourceKey: SourceKeySchema,
						user: UserSchema,
						repository: RepositorySchema,
						group: z.null().optional(),
					}),
				)
		: z
				.object({
					sourceKey: SourceKeySchema,
					repository: RepositorySchema,
					user: UserSchema.optional(),
					group: z.null().optional(),
				})
				.or(
					z.object({
						sourceKey: SourceKeySchema,
						repository: RepositorySchema.optional(),
						user: UserSchema,
						group: z.null().optional(),
					}),
				);

export type SelectFormSchemaType = z.infer<ReturnType<typeof getSelectStorageFormSchema>>;
