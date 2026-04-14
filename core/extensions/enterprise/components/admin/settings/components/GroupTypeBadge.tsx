import { Badge } from "@ui-kit/Badge";
import type { Group } from "../workspace/components/access/components/group/types/GroupTypes";
import { getGroupSourceLabel } from "../workspace/components/access/components/group/utils/groupUtils";

interface GroupTypeBadgeProps {
	group: Pick<Group, "id" | "source">;
}

export const GroupTypeBadge = ({ group }: GroupTypeBadgeProps) => {
	const label = getGroupSourceLabel(group);

	return (
		<Badge focus="low" size="sm">
			{label}
		</Badge>
	);
};
