import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import {
	IconPicker,
	type IconPickerOptions,
	type IconPickerValue,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { useRandomIconPickerValue } from "@ext/markdown/elements/icon/edit/logic/hooks/useRandomIconPickerValue";
import { InlineTriggerButton } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface PopoverIconPickerProps extends IconPickerOptions {
	label: string;
	onClear?: () => void;
}

const TriggerButtonLogo = ({ value }: { value: IconPickerValue }) => {
	if ("emoji" in value) return <span className="shrink-0 text-base leading-none">{value.emoji}</span>;
	if ("code" in value) return <Icon className="shrink-0" color={value.color} icon={value.code} />;
	return null;
};

export const PopoverIconPicker = (props: PopoverIconPickerProps) => {
	const { label, value, onChange, size = "sm", disable, disableCatalogIcons = true, color, onClear } = props;
	const randomLogo = useRandomIconPickerValue(onChange, disable);

	return (
		<Popover>
			<PopoverTriggerButton
				className={cn("w-full justify-start pr-2.5 pl-3 py-1.5 font-normal", !value && "text-muted")}
				containerClassName="w-full justify-start"
				variant="outline"
			>
				{value && <TriggerButtonLogo value={value} />}
				<TextOverflowTooltip>{label}</TextOverflowTooltip>
				<div className="flex items-center ml-auto">
					{value ? <InlineTriggerButton className="shrink-0" onClick={onClear} /> : null}
					<Tooltip>
						<TooltipContent>{t("pick-random-value")}</TooltipContent>
						<TooltipTrigger asChild>
							<span>
								<InlineTriggerButton className="shrink-0" icon="dices" onClick={randomLogo} />
							</span>
						</TooltipTrigger>
					</Tooltip>
					<span className="text-muted pl-2 shrink-0 aspect-square inline-flex items-center justify-center">
						<Icon icon="chevron-down" />
					</span>
				</div>
			</PopoverTriggerButton>
			<PopoverContent className="p-0 w-auto rounded-xl">
				<IconPicker
					className="max-h-96"
					color={color}
					disable={disable}
					disableCatalogIcons={disableCatalogIcons}
					onChange={onChange}
					size={size}
					value={value}
				/>
			</PopoverContent>
		</Popover>
	);
};
