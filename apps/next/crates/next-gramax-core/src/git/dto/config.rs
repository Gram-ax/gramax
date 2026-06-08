#[napi(object)]
#[derive(Clone)]
pub struct ConfigValue {
	pub kind: String,
	pub val: String,
}

impl From<ConfigValue> for gramaxgit::ConfigValue {
	fn from(val: ConfigValue) -> Self {
		match val.kind.as_str() {
			"str" => gramaxgit::ConfigValue::Str(val.val),
			"i32" => gramaxgit::ConfigValue::I32(val.val.parse::<i32>().unwrap()),
			"i64" => gramaxgit::ConfigValue::I64(val.val.parse::<i64>().unwrap()),
			"bool" => gramaxgit::ConfigValue::Bool(val.val.parse::<bool>().unwrap()),
			_ => gramaxgit::ConfigValue::Str(val.val),
		}
	}
}
