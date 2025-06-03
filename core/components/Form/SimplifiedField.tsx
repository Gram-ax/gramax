const SimplifiedField = ({ label, description, children }) => (
	<div className="form-group">
		<div className="field field-string row">
			<label className="control-label">
				<div>
					<div style={{ display: "flex" }}>
						<span>{label}</span>
					</div>
				</div>
			</label>
			<div className="input-lable">{children}</div>
		</div>
		{description && (
			<div className="input-lable-description">
				<div />
				<div className="article">{description}</div>
			</div>
		)}
	</div>
);

export default SimplifiedField;
