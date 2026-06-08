import TagInputWithKeyboard from "@components/Atoms/TagInputWithKeyboard";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { DEFAULT_LFS_PATTERNS } from "../options";

interface LfsPatternsEditorProps {
	value: string[];
	onChange: (patterns: string[]) => void;
	readonly?: boolean;
	placeholder?: string;
	title?: string;
	description?: string;
}

const LfsPatternsEditor = ({ value, onChange, readonly, placeholder, title, description }: LfsPatternsEditorProps) => {
	return (
		<div className="flex flex-col gap-1 w-full">
			<div className="flex gap-2 w-full justify-between items-center">
				<span className="text-sm font-medium">
					{title ?? t("forms.catalog-edit-props.props.lfs.patterns.name")}
				</span>
				<div className="flex items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<IconButton
								className="p-0"
								icon="rotate-cw"
								onClick={(ev) => {
									ev.preventDefault();
									onChange(DEFAULT_LFS_PATTERNS);
								}}
								size="xs"
								type="button"
								variant="text"
							/>
						</TooltipTrigger>
						<TooltipContent>
							{t("forms.catalog-edit-props.props.lfs.patterns.default-tooltip")}
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<IconButton
								className="p-0"
								icon="x"
								onClick={(ev) => {
									ev.preventDefault();
									onChange([]);
								}}
								size="sm"
								type="button"
								variant="text"
							/>
						</TooltipTrigger>
						<TooltipContent>{t("clear")}</TooltipContent>
					</Tooltip>
				</div>
			</div>
			<TagInputWithKeyboard
				description={description}
				onChange={onChange}
				placeholder={placeholder ?? t("forms.catalog-edit-props.props.lfs.patterns.placeholder")}
				readonly={readonly}
				value={value}
			/>
		</div>
	);
};

export default LfsPatternsEditor;
