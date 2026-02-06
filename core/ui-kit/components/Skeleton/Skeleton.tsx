import { Skeleton as UiKitSkeleton } from "ics-ui-kit/components/skeleton";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitSkeletonProps = ExtractComponentGeneric<typeof UiKitSkeleton>;

interface SkeletonProps extends UiKitSkeletonProps {}

export const Skeleton: FC<SkeletonProps> = (props) => {
	return <UiKitSkeleton {...props} data-qa="loader" />;
};
