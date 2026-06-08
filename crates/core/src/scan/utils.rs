use crate::Result;

pub(crate) fn empty_object() -> serde_json::Value {
	serde_json::Value::Object(serde_json::Map::new())
}

pub(crate) fn yaml_to_json_or_empty(bytes: &[u8]) -> Result<serde_json::Value> {
	let yaml: serde_yml::Value = serde_yml::from_slice(bytes)?;
	let json = serde_json::to_value(yaml)?;

	if !json.is_object() {
		Ok(empty_object())
	} else {
		Ok(json)
	}
}
