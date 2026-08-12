import { FormField as UiKitFormField } from "ics-ui-kit/components/form";
import React, { type FC, type ReactNode } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitFormFieldProps = ExtractComponentGeneric<typeof UiKitFormField>;

interface FormFieldProps extends Omit<UiKitFormFieldProps, "description" | "title"> {
	title: ReactNode | string;
	description?: ReactNode | string;
	labelSuffix?: ReactNode;
}

interface ControlWrapperProps {
	labelSuffix?: ReactNode;
	children?: ReactNode;
}

// UiKitFormField's FormControl renders `control`'s return value through a
// Radix Slot, which clones its `id` / `aria-describedby` / `aria-invalid`
// (and, if ever set, a ref) onto whatever single element `control` returns —
// that's how the field's <label htmlFor> and error state stay wired to the
// real input. Inserting this positioning div between Slot and the input would
// break that link (the div would get `id`/`aria-*` instead of the input), so
// it re-forwards them via cloneElement onto the actual control.
const ControlWrapper = React.forwardRef<HTMLElement, ControlWrapperProps>(
	({ labelSuffix, children, ...props }, ref) => {
		const child = React.Children.only(children);
		const clonedChild = React.isValidElement(child)
			? React.cloneElement(child as React.ReactElement, { ...props, ref } as React.Attributes)
			: child;

		return (
			<div className="relative w-full">
				<div className="absolute right-0 -top-[28px] z-10 pointer-events-auto flex items-center">
					{labelSuffix}
				</div>
				{clonedChild}
			</div>
		);
	},
);
ControlWrapper.displayName = "ControlWrapper";

export const FormField: FC<FormFieldProps> = (props) => {
	const { description, title, labelSuffix, control, ...rest } = props;

	let renderControl = control;
	if (labelSuffix && control) {
		renderControl = (fieldProps) => (
			<ControlWrapper labelSuffix={labelSuffix}>{control(fieldProps)}</ControlWrapper>
		);
	}

	return (
		<UiKitFormField
			{...rest}
			control={renderControl as UiKitFormFieldProps["control"]}
			description={description as string}
			title={title as string}
		/>
	);
};
