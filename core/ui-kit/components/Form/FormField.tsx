import { FormField as UiKitFormField } from "ics-ui-kit/components/form";
import { FC, ReactNode } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitFormFieldProps = ExtractComponentGeneric<typeof UiKitFormField>;

interface FormFieldProps extends Omit<UiKitFormFieldProps, "description" | "title"> {
	title: ReactNode | string;
	description?: ReactNode | string;
}

export const FormField: FC<FormFieldProps> = (props) => {
	const { description, title, ...rest } = props;
	return <UiKitFormField {...rest} description={description as string} title={title as string} />;
};
