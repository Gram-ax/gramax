import { Divider } from "@ui-kit/Divider";
import { ModalBody } from "@ui-kit/Modal";

const CloudModalBody = ({ children }: { children: React.ReactNode }) => (
	<>
		<Divider />
		<ModalBody>
			<div className="article" style={{ background: "initial" }}>
				{children}
			</div>
		</ModalBody>
		<Divider />
	</>
);

export default CloudModalBody;
