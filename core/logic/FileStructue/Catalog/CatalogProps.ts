import type { RefInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { FSLocalizationProps } from "@ext/localization/core/events/FSLocalizationEvents";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import type TabsTags from "@ext/markdown/elements/tabs/model/TabsTags";
import type { TitledLink } from "@ext/navigation/NavigationLinks";
import type { Property } from "@ext/properties/models";

export type CatalogProps = FSLocalizationProps & {
	title?: string;
	description?: string;
	url?: string;
	docroot?: string;
	tabsTags?: TabsTags;
	contactEmail?: string;
	properties?: Property[];
	versions?: string[];
	syntax?: Syntax;

	relatedLinks?: TitledLink[];
	private?: string[];
	hidden?: boolean;
	refs?: string[];

	sharePointDirectory?: string;

	isCloning?: boolean;
	cloneCancelDisabled?: boolean;
	redirectOnClone?: string;
	resolvedVersions?: RefInfo[];
	resolvedVersion?: RefInfo;
	optionalCategoryIndex?: boolean;

	logo?: string;

	docrootIsNoneExistent?: boolean;
};

export const ExcludedProps: (keyof CatalogProps)[] = [
	"url",
	"docroot",
	"resolvedVersions",
	"resolvedVersion",
	"isCloning",
];
