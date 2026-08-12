// biome-ignore lint/style/noRestrictedImports: // TODO: fix
import styled from "@emotion/styled";
import { Field } from "@ui-kit/Field";

export const StyledField = styled(Field)`
	& > div:first-of-type {
		width: 30%;
	}
`;
