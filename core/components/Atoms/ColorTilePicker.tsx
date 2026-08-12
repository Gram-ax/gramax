import Style from "@components/HomePage/Cards/model/Style";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { tv } from "tailwind-variants";

// Spectrum order: red → orange → yellow → green → teal → blue → purple → neutral
export const SPECTRUM: Style[] = [
	Style.red,
	Style.redOrange,
	Style.orangeRed,
	Style.brightOrange,
	Style.darkOrange,
	Style.orangeGreen,
	Style.redGreen,
	Style.greenOrange,
	Style.green,
	Style.blueGreen,
	Style.teal,
	Style.blue,
	Style.pinkBlue,
	Style.purpleBlue,
	Style.bluePurple,
	Style.purple,
	Style.pinkPurple,
	Style.purpleOrange,
	Style.bluePink,
	Style.black,
];

interface ColorTilePickerProps {
	value?: Style;
	onChange?: (style: Style) => void;
}

const colorTileStyles = tv({
	base: "w-16 h-8 rounded-sm cursor-pointer border",
	variants: {
		selected: {
			true: "border-inverse-muted",
			false: "border-alpha-high-90",
		},
	},
});

export const ColorTilePicker = ({ value, onChange }: ColorTilePickerProps) => {
	return (
		<div className="grid grid-rows-2 grid-cols-4 gap-1.5 p-1.5" data-testid="color-tile-picker">
			{SPECTRUM.map((style) => (
				<Tooltip delayDuration={250} key={style}>
					<TooltipTrigger asChild>
						<div
							className={colorTileStyles({ selected: value === style })}
							data-selected={value === style}
							data-testid={`color-tile-picker-item-${style}`}
							onClick={() => onChange?.(value === style ? null : style)}
							style={{ background: `var(--color-card-bg-${style})` }}
						/>
					</TooltipTrigger>
					<TooltipContent>{t(`catalog.style.${style}`)}</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
};
