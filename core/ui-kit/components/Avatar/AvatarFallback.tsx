import { AvatarFallback as UiKitAvatarFallback } from "ics-ui-kit/components/avatar";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";
import { getUniqueColor } from "@ui-kit/Avatar";
import styled from "@emotion/styled";

type UiKitAvatarFallbackProps = ExtractComponentGeneric<typeof UiKitAvatarFallback>;

interface AvatarFallbackProps extends UiKitAvatarFallbackProps {
	/** Used to generate a unique color for the avatar fallback */
	uniqueId?: string;
}

const NonstyledAvatarFallback: FC<AvatarFallbackProps> = (props) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { uniqueId: _, ...otherProps } = props;
	return <UiKitAvatarFallback {...otherProps} />;
};

export const AvatarFallback = styled(NonstyledAvatarFallback)`
	background-color: ${({ uniqueId }) => (uniqueId ? getUniqueColor(uniqueId) : undefined)};
`;
