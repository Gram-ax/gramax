import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import LanguageService from "@core-ui/ContextServices/Language";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { MenuItemInfoTemplate } from "@ui-kit/MenuItem";
import { useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { IconButton } from "@ui-kit/Button";

const SwitchUiLanguage = ({ size = "md" }: { size?: "md" | "lg" }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext } = usePlatform();

	const setLanguage = useCallback(
		async (language: UiLanguage) => {
			if (!isNext) return LanguageService.setUiLanguage(language);

			const r = await FetchService.fetch(apiUrlCreator.getSetLanguageURL(language));
			if (r.ok) LanguageService.setUiLanguage(language);
		},
		[apiUrlCreator],
	);

	const current = LanguageService.currentUi();

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipContent>{t("change-language")}</TooltipContent>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger data-qa={`qa-language-${current}`} asChild>
						<IconButton
							icon="globe"
							size={size}
							iconClassName="h-5 w-5 stroke-[1.6]"
							variant="ghost"
							className="aspect-square p-2"
						/>
					</DropdownMenuTrigger>
				</TooltipTrigger>
			</Tooltip>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					{Object.values(UiLanguage).map((l, idx) => (
						<DropdownMenuItem
							key={idx + l}
							onClick={l == current ? null : () => setLanguage(l)}
							data-qa="qa-clickable"
						>
							<MenuItemInfoTemplate text={t("current", l)} isSelected={current == l} />
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchUiLanguage;
