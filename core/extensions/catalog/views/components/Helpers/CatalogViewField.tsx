// biome-ignore lint/style/noRestrictedImports: legacy styled component, migrate to Tailwind later
import styled from "@emotion/styled";
import { FormField } from "@ui-kit/Form";
import type { ExtractComponentGeneric } from "../../../../../ui-kit/lib/extractComponentGeneric";

type CatalogViewFieldProps = Omit<ExtractComponentGeneric<typeof FormField>, "children" | "labelClassName" | "layout">;

const FieldWrapper = styled.div`
    label {
        width: 100%;
    }
`;

export const CatalogViewField = (props: CatalogViewFieldProps) => {
	return (
		<FieldWrapper>
			<FormField {...props} labelClassName="w-full" layout="vertical" />
		</FieldWrapper>
	);
};
