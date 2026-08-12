import { SPECTRUM } from "@components/Atoms/ColorTilePicker";
import type Style from "@components/HomePage/Cards/model/Style";
import t from "@ext/localization/locale/translate";
import { ColorTile } from "@ui-kit/ColorTile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface PropertyStylePickerProps {
	value?: Style;
	onChange?: (style: Style) => void;
}

export const PropertyStylePicker = ({ value, onChange }: PropertyStylePickerProps) => {
	return (
		<div className="grid grid-flow-col grid-rows-2 gap-1 p-1.5" data-testid="color-tile-picker">
			{SPECTRUM.map((style) => (
				<div
					className="[&>div:first-of-type]:border-inverse-muted"
					data-testid={`color-tile-picker-item-${style}`}
					key={style}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<ColorTile
								className="border-alpha-high-90"
								key={style}
								onClick={() => onChange?.(value === style ? null : style)}
								selected={value === style}
								style={{ background: `var(--color-property-bg-${style})` }}
							/>
						</TooltipTrigger>
						<TooltipContent>{t(`catalog.style.${style}`)}</TooltipContent>
					</Tooltip>
				</div>
			))}
		</div>
	);
};
