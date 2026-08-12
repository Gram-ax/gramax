import t from "@ext/localization/locale/translate";
import { z } from "zod";

export type CatalogSettingsModalProps = {
	modalContentProps?: Record<string, unknown>;
	onSubmit?: (editProps: FormData) => void;
	onClose?: () => void;
	startUpdatingProps?: () => void;
};

export type FormProps = {
	labelClassName?: string;
	layout?: "vertical" | "horizontal";
};

export type SelectOption = {
	value: string;
	children: string;
};

export type MultiSelectOption = {
	value: string;
	label: string;
};

export type FormSelectValues = {
	cardColors: SelectOption[];
	languages: SelectOption[];
	syntaxes: SelectOption[];
};

export type CreateFormSchema = {
	allCatalogNames: string[];
	validateEncodingSymbolsUrl: (value: string) => boolean;
};

const logoStateSchema = z.union([
	z.object({ type: z.literal("icon"), code: z.string(), color: z.string().nullable() }),
	z.object({ type: z.literal("emoji"), emoji: z.string() }),
	z.object({
		type: z.literal("file"),
		preview: z.string(),
		content: z.string().optional(),
		file: z.instanceof(File).nullable(),
	}),
]);

export const createFormSchema = ({ allCatalogNames, validateEncodingSymbolsUrl }: CreateFormSchema) =>
	z.object({
		title: z.string().min(2, { message: t("directory-name-min-length") }),
		url: z
			.string()
			.min(2, { message: t("repository-name-min-length") })
			.refine((value) => validateEncodingSymbolsUrl(value), {
				message: t("no-encoding-symbols-in-url"),
			})
			.refine((value) => !allCatalogNames.some((name) => name.toLowerCase() === value.toLowerCase()), {
				message: t("catalog.error.already-exist"),
			}),
		docroot: z.optional(z.string().nullable()),
		language: z.optional(z.string().nullable()),
		versions: z.optional(z.array(z.string()).nullable()),
		description: z.optional(
			z
				.string()
				.max(50, { message: `${t("max-length")}50` })
				.nullable(),
		),
		style: z.optional(z.string().nullable()),
		code: z.optional(
			z
				.string()
				.max(4, { message: `${t("max-length")}4` })
				.nullable(),
		),
		logo: z
			.object({
				light: logoStateSchema.nullable().optional(),
				dark: logoStateSchema.nullable().optional(),
			})
			.optional(),
		syntax: z.optional(z.string().nullable()),
		icons: z.optional(
			z
				.array(
					z.object({
						name: z.string(),
						content: z.string(),
						type: z.string().default("svg"),
						size: z.number(),
					}),
				)
				.nullable(),
		),
		lfs: z
			.object({
				patterns: z.optional(z.array(z.string()).nullable()),
			})
			.default({
				patterns: [],
			}),
	});

export type FormData = z.infer<ReturnType<typeof createFormSchema>>;
