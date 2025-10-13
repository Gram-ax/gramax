import { FormField as UiKitFormField } from "ics-ui-kit/components/form";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC, ReactNode } from "react";

type UiKitFormFieldProps = ExtractComponentGeneric<typeof UiKitFormField>;

interface FormFieldProps extends Omit<UiKitFormFieldProps, "description"> {
	description?: ReactNode | string;
}

export const FormField: FC<FormFieldProps> = (props) => {
	const { description, ...rest } = props;
	return <UiKitFormField {...rest} description={description as string} />;
};
