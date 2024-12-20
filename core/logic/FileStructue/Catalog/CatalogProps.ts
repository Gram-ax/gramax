
import type { RefInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { FSLocalizationProps } from "@ext/localization/core/events/FSLocalizationEvents";
import type TabsTags from "@ext/markdown/elements/tabs/model/TabsTags";
import type { TitledLink } from "@ext/navigation/NavigationLinks";
import type { Property } from "@ext/properties/models";

export type CatalogProps = FSLocalizationProps & {
	title?: string;
	description?: string;
	url?: string;
	docroot?: string;
	readOnly?: boolean;
	tabsTags?: TabsTags;
	contactEmail?: string;
	properties?: Property[];
	versions?: string[];

	relatedLinks?: TitledLink[];
	private?: string[];
	hidden?: boolean;
	refs?: string[];

	sharePointDirectory?: string;

	isCloning?: boolean;
	resolvedVersions?: RefInfo[];
	resolvedVersion?: RefInfo;
	optionalCategoryIndex?: boolean;
};

export const ExcludedProps: (keyof CatalogProps)[] = ["url", "docroot", "resolvedVersions", "resolvedVersion"];
