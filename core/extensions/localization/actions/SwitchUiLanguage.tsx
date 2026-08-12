import { topMenuItemClassName } from "@components/HomePage/TopMenu/const";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { useSetting, useSettingEffect } from "@ext/settings/logic/hooks";
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
import { refreshPage } from "../../../ui-logic/utils/initGlobalFuncs";

const SwitchUiLanguage = ({ size = "md" }: { size?: "md" | "lg" }) => {
	const [current, setLanguage] = useSetting("general.language");
	useSettingEffect("general.language", refreshPage);

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
					{Object.values(UiLanguage).map((l) => (
						<DropdownMenuItem
							data-qa="qa-clickable"
							key={l}
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
