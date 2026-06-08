import { TextOverflowTooltip } from "@ui-kit/Tooltip";

const DiffEntryTitle = ({ children }: { children: React.ReactNode }) => (
	<span className="flex items-center justify-start overflow-hidden text-ellipsis whitespace-nowrap max-w-full [&>svg]:mr-[0.2em]">
		{children}
	</span>
);

export const DiffEntryTitleTooltip = ({ name }: { name: string }) => (
	<DiffEntryTitle>
		<TextOverflowTooltip className="inline w-full pl-0">{name}</TextOverflowTooltip>
	</DiffEntryTitle>
);

export default DiffEntryTitle;
