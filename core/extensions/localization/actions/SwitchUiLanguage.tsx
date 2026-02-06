import { topMenuItemClassName } from "@components/HomePage/TopMenu";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import LanguageService from "@core-ui/ContextServices/Language";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { MenuItemInfoTemplate } from "@ui-kit/MenuItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback } from "react";

const SwitchUiLanguage = ({ size = "md" }: { size?: "md" | "lg" }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext } = usePlatform();

	const setLanguage = useCallback(
		async (language: UiLanguage) => {
			if (!isNext) return LanguageService.setUiLanguage(language);

			const r = await FetchService.fetch(apiUrlCreator.getSetLanguageURL(language));
			if (r.ok) LanguageService.setUiLanguage(language);
		},
		[apiUrlCreator, isNext],
	);

	const current = LanguageService.currentUi();

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipContent>{t("change-language")}</TooltipContent>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger
						asChild
						className={topMenuItemClassName}
						data-qa={`qa-language-${current}`}
						data-testid="switch-ui-language"
					>
						<IconButton
							className="aspect-square p-2"
							icon="globe"
							iconClassName="h-5 w-5 stroke-[1.6]"
							size={size}
							variant="ghost"
						/>
					</DropdownMenuTrigger>
				</TooltipTrigger>
			</Tooltip>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					{Object.values(UiLanguage).map((l, idx) => (
						<DropdownMenuItem
							data-qa="qa-clickable"
							key={idx + l}
							onClick={l === current ? null : () => setLanguage(l)}
						>
							<MenuItemInfoTemplate isSelected={current === l} text={t("current", l)} />
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchUiLanguage;
