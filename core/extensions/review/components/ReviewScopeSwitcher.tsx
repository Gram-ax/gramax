import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import t from "@ext/localization/locale/translate";
import { ReviewListCounter } from "@ext/review/components/ReviewListCounter";
import type { ScopedItemList } from "@ext/review/logic/hooks/useScopedItems";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import type { ReviewScope } from "../models/ReviewList";

interface ReviewScopeSwitcherProps {
	scope: ReviewScope;
	articleScopeData: ScopedItemList;
	catalogScopeData: ScopedItemList;
	onChange: (scope: ReviewScope) => void;
}

const ICON_BY_SCOPE: Record<ReviewScope, IconCode> = {
	catalog: "globe",
	article: "file-text",
};

export const ReviewScopeSwitcher = (props: ReviewScopeSwitcherProps) => {
	const { scope, onChange, articleScopeData, catalogScopeData } = props;
	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton className="px-1 mr-1.5 whitespace-nowrap -ml-1" size="xs" variant="text">
				{scope === "catalog" ? t("editor.modes.tabs.catalog") : t("editor.modes.tabs.article")}
				<Icon icon="chevron-down" />
			</DropdownMenuTriggerButton>
			<DropdownMenuContent>
				<DropdownMenuRadioGroup onValueChange={onChange} value={scope}>
					<DropdownMenuRadioItem className="[&>span]:ml-0" value="catalog">
						<Icon icon={ICON_BY_SCOPE.catalog} />
						{t("editor.modes.tabs.catalog")}
						<ReviewListCounter
							className="ml-auto text-primary-fg font-normal"
							count={catalogScopeData.count}
							indicator={false}
							unreadCount={catalogScopeData.unreadCount}
						/>
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem className="[&>span]:ml-0" value="article">
						<Icon icon={ICON_BY_SCOPE.article} />
						{t("editor.modes.tabs.article")}
						<ReviewListCounter
							className="ml-auto text-primary-fg font-normal"
							count={articleScopeData.count}
							indicator={false}
							unreadCount={articleScopeData.unreadCount}
						/>
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
