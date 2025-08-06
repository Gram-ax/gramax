import Icon from "@components/Atoms/Icon";
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
	DropdownMenuTriggerButton,
} from "ics-ui-kit/components/dropdown";
import { MenuItemInfoTemplate } from "ics-ui-kit/components/menu-item";
import { useCallback } from "react";

const SwitchUiLanguage = () => {
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
			<DropdownMenuTriggerButton variant="ghost" className="aspect-square p-2" data-qa={`qa-language-${current}`}>
				<Icon code={"globe"} />
			</DropdownMenuTriggerButton>
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
