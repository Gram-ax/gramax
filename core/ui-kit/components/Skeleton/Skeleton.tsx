import { Skeleton as UiKitSkeleton } from "ics-ui-kit/components/skeleton";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitSkeletonProps = ExtractComponentGeneric<typeof UiKitSkeleton>;

interface SkeletonProps extends UiKitSkeletonProps {}

export const Skeleton: FC<SkeletonProps> = (props) => {
	return <UiKitSkeleton {...props} data-qa="loader" />;
};
