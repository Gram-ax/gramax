export const FORM_VALIDATION = {
	TITLE_MIN_LENGTH: 2,
	URL_MIN_LENGTH: 2,
	DESCRIPTION_MAX_LENGTH: 50,
	CODE_MAX_LENGTH: 4,
} as const;

export const FORM_STYLES = {
	LABEL_WIDTH: "w-44",
} as const;

export const FORM_DATA_QA = {
	TITLE: "qa-catalog-title",
	URL: "qa-catalog-url",
	DOCROOT: "qa-catalog-docroot",
	LANGUAGE: "qa-catalog-language",
	DESCRIPTION: "qa-catalog-description",
	CODE: "qa-catalog-code",
	SYNTAX: "qa-catalog-syntax",
	CLICKABLE: "qa-clickable",
} as const;
