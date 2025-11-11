import type { RefInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { FSLocalizationProps } from "@ext/localization/core/events/FSLocalizationEvents";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import type { TitledLink } from "@ext/navigation/NavigationLinks";
import type { Property, PropertyID } from "@ext/properties/models";

export type CatalogProps = FSLocalizationProps & {
	title?: string;
	description?: string;
	url?: string;
	docroot?: string;
	contactEmail?: string;
	properties?: Property[];
	versions?: string[];
	filterProperties?: PropertyID[];
	syntax?: Syntax;

	relatedLinks?: TitledLink[];
	private?: string[];
	hidden?: boolean;
	refs?: string[];

	sharePointDirectory?: string;

	isCloning?: boolean;
	cloneCancelDisabled?: boolean;
	redirectOnClone?: string;
	resolvedFilterProperty?: PropertyID;
	resolvedVersions?: RefInfo[];
	resolvedVersion?: RefInfo;
	optionalCategoryIndex?: boolean;

	logo?: string;

	docrootIsNoneExistent?: boolean;
};

export const ExcludedProps: (keyof CatalogProps)[] = [
	"url",
	"docroot",
	"docrootIsNoneExistent",
	"resolvedVersions",
	"resolvedVersion",
	"isCloning",
	"cloneCancelDisabled",
	"redirectOnClone",
];
