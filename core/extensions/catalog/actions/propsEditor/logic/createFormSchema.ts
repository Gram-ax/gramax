import t from "@ext/localization/locale/translate";
import { z } from "zod";

export type CatalogSettingsModalProps = {
	isOpen?: boolean;
	modalContentProps?: Record<string, unknown>;
	onSubmit?: (editProps: FormData) => void;
	onClose?: () => void;
	trigger?: JSX.Element;
	startUpdatingProps?: () => void;
};

export type FormProps = {
	labelClassName: string;
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
	cardColors: string[];
	languages: SelectOption[];
	syntaxes: SelectOption[];
};

export type CreateFormSchema = {
	allCatalogNames: string[];
	validateEncodingSymbolsUrl: (value: string) => boolean;
};

export const createFormSchema = ({ allCatalogNames, validateEncodingSymbolsUrl }: CreateFormSchema) =>
	z.object({
		title: z
			.string()
			.min(2, { message: t("directory-name-min-length") })
			.refine((value) => !allCatalogNames.includes(value), {
				message: t("catalog.error.already-exist"),
			}),
		url: z
			.string()
			.min(2, { message: t("repository-name-min-length") })
			.refine((value) => validateEncodingSymbolsUrl(value), {
				message: t("no-encoding-symbols-in-url"),
			}),
		docroot: z.optional(z.string().nullable()),
		language: z.optional(z.string().nullable()),
		versions: z.optional(z.array(z.string()).nullable()),
		filterProperties: z.optional(z.array(z.string()).nullable()),
		description: z.optional(
			z
				.string()
				.max(50, { message: t("max-length") + "50" })
				.nullable(),
		),
		style: z.optional(z.string().nullable()),
		code: z.optional(
			z
				.string()
				.max(4, { message: t("max-length") + "4" })
				.nullable(),
		),
		syntax: z.optional(z.string().nullable()),
	});

export type FormData = z.infer<ReturnType<typeof createFormSchema>>;
