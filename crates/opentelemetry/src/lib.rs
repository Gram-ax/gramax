use opentelemetry_sdk::trace::SpanData;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OtelSpan {
	pub name: String,
	pub span_id: String,
	pub trace_id: String,
	pub duration: f64,
	pub timestamp: f64,
	pub error: Option<String>,
	pub args: Option<serde_json::Value>,
	pub result: Option<serde_json::Value>,
	#[serde(deserialize_with = "deserialize_attrs", default)]
	pub attrs: serde_json::Map<String, serde_json::Value>,
	#[serde(default)]
	pub events: Vec<OtelSpanEvent>,
	pub parent_span_id: Option<String>,
}

fn deserialize_attrs<'de, D: serde::Deserializer<'de>>(deserializer: D) -> std::result::Result<serde_json::Map<String, serde_json::Value>, D::Error> {
	#[derive(Deserialize)]
	#[serde(untagged)]
	enum Attrs {
		Map(serde_json::Map<String, serde_json::Value>),
		List(Vec<AttrEntry>),
	}

	#[derive(Deserialize)]
	struct AttrEntry {
		key: String,
		value: serde_json::Value,
	}

	match Attrs::deserialize(deserializer)? {
		Attrs::Map(m) => Ok(m),
		Attrs::List(list) => {
			let mut map = serde_json::Map::with_capacity(list.len());
			for entry in list {
				map.insert(entry.key, entry.value);
			}
			Ok(map)
		}
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OtelSpanEvent {
	pub name: String,
	#[serde(default, alias = "timestamp", deserialize_with = "deserialize_event_time")]
	pub time: Option<f64>,
	#[serde(default, skip_serializing_if = "serde_json::Map::is_empty")]
	pub attributes: serde_json::Map<String, serde_json::Value>,
}

fn deserialize_event_time<'de, D: serde::Deserializer<'de>>(deserializer: D) -> std::result::Result<Option<f64>, D::Error> {
	#[derive(Deserialize)]
	#[serde(untagged)]
	enum Time {
		HrTime([f64; 2]),
		Seconds(f64),
		Null,
	}

	match Option::<Time>::deserialize(deserializer)? {
		Some(Time::HrTime([sec, nsec])) => Ok(Some(sec + nsec / 1e9)),
		Some(Time::Seconds(s)) => Ok(Some(s)),
		Some(Time::Null) | None => Ok(None),
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpanParent {
	pub span_id: String,
	pub trace_id: String,
}

impl From<&SpanData> for OtelSpan {
	fn from(span: &SpanData) -> Self {
		let duration = span.end_time.duration_since(span.start_time).unwrap_or_default().as_secs_f64() * 1000.0;
		let timestamp = span
			.start_time
			.duration_since(std::time::SystemTime::UNIX_EPOCH)
			.unwrap_or_default()
			.as_secs_f64();

		let mut target: Option<String> = None;
		let mut args = None;
		let mut result = None;
		let mut attrs = serde_json::Map::new();

		for kv in span.attributes.iter() {
			let key = kv.key.as_str();
			match key {
				"target" => target = Some(kv.value.as_str().into_owned()),
				"args" => args = Some(to_json(&kv.value)),
				"res" => result = Some(to_json(&kv.value)),
				_ => {
					attrs.insert(key.to_string(), to_json(&kv.value));
				}
			}
		}

		let name = match target {
			Some(ref t) => format!("{t}::{}", span.name),
			None => span.name.to_string(),
		};

		let error = match &span.status {
			opentelemetry::trace::Status::Error { description } => Some(description.to_string()),
			_ => None,
		};

		let parent_span_id = (span.parent_span_id != opentelemetry::trace::SpanId::INVALID).then(|| span.parent_span_id.to_string());

		let events = span.events.iter().filter(|e| e.name != "exception").map(OtelSpanEvent::from).collect();

		OtelSpan {
			name,
			span_id: span.span_context.span_id().to_string(),
			trace_id: span.span_context.trace_id().to_string(),
			duration,
			timestamp,
			error,
			args,
			result,
			attrs,
			events,
			parent_span_id,
		}
	}
}

impl From<&opentelemetry::trace::Event> for OtelSpanEvent {
	fn from(event: &opentelemetry::trace::Event) -> Self {
		let target = event
			.attributes
			.iter()
			.find(|kv| kv.key.as_str() == "target")
			.map(|kv| kv.value.to_string());

		let timestamp = event
			.timestamp
			.duration_since(std::time::SystemTime::UNIX_EPOCH)
			.ok()
			.map(|d| d.as_secs_f64());

		let attributes = event
			.attributes
			.iter()
			.filter(|kv| !matches!(kv.key.as_str(), "args" | "level" | "target"))
			.map(|kv| (kv.key.as_str().to_string(), to_json(&kv.value)))
			.collect();

		OtelSpanEvent {
			name: if let Some(target) = target {
				format!("{}: {}", target, event.name)
			} else {
				event.name.to_string()
			},
			time: timestamp,
			attributes,
		}
	}
}

pub fn to_json(value: &opentelemetry::Value) -> serde_json::Value {
	use opentelemetry::Array;
	use opentelemetry::Value;

	match value {
		Value::Bool(b) => (*b).into(),
		Value::I64(n) => (*n).into(),
		Value::F64(n) => (*n).into(),
		Value::String(s) => serde_json::from_str(s.as_str()).unwrap_or_else(|_| s.as_str().into()),
		Value::Array(Array::Bool(v)) => serde_json::json!(v),
		Value::Array(Array::I64(v)) => serde_json::json!(v),
		Value::Array(Array::F64(v)) => serde_json::json!(v),
		Value::Array(Array::String(v)) => v.iter().map(|s| serde_json::Value::String(s.to_string())).collect(),
		_ => serde_json::Value::Null,
	}
}
