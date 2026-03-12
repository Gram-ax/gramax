import { DialogBody } from "@ui-kit/Dialog";
import { Divider } from "@ui-kit/Divider";

const CloudModalBody = ({ children }: { children: React.ReactNode }) => (
	<>
		<Divider />
		<DialogBody>
			<div className="article" style={{ background: "initial" }}>
				{children}
			</div>
		</DialogBody>
		<Divider />
	</>
);

export default CloudModalBody;
