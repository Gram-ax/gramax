import { Tag } from "@ui-kit/Tag";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import type { ExtractComponentGeneric } from "../../../../../ui-kit/lib/extractComponentGeneric";

type CatalogViewTagProps = Omit<
	ExtractComponentGeneric<typeof Tag>,
	"status" | "startIcon" | "endIcon" | "size" | "containerClassName" | "buttonClassName"
> & {
	state: "active" | "inactive";
};

export const CatalogViewTag = (props: CatalogViewTagProps) => {
	const { state = "inactive", children, ...otherProps } = props;
	const isActive = state === "active";

	return (
		<Tag
			aria-selected={isActive}
			buttonClassName="rounded-full"
			containerClassName="w-auto"
			focus={isActive ? "high" : "low"}
			size="sm"
			type="button"
			{...otherProps}
		>
			<TextOverflowTooltip>{children}</TextOverflowTooltip>
		</Tag>
	);
};
