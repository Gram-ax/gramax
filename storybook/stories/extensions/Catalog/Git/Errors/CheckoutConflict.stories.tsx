import Modal from "@components/Layouts/Modal";
import CheckoutConflictErrorComponent from "@ext/git/actions/Branch/error/components/CheckoutConflictError";
import { Meta } from "@storybook/react";
import { useState } from "react";
import mock from "storybook/data/mock";
import checkoutApi from "storybook/stories/extensions/Catalog/Git/BranchActions/checkoutApi";
import publishApi from "storybook/stories/extensions/Catalog/Git/Publish/publishApi";
import ErrorBoundaryDecorator from "storybook/styles/decorators/ErrorBoundaryDecorator";

export const CheckoutConflict = {
	render: () => {
		const [isOpen, setIsOpen] = useState(true);
		return (
			<Modal isOpen={isOpen}>
				<CheckoutConflictErrorComponent onCancelClick={() => setIsOpen(false)} error={undefined} />
			</Modal>
		);
	},
};

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Errors/CheckoutConflict",
	decorators: [ErrorBoundaryDecorator],
	parameters: {
		msw: mock([...publishApi, ...checkoutApi]),
	},
};

export default meta;
