use super::*;
use axum::body::to_bytes;
use axum::body::Body;
use axum::http::Method;
use reqwest::StatusCode;
use tower::Service;

fn unreachable_s3() -> S3BaseUrl {
	S3BaseUrl("http://127.0.0.1:1/bucket".parse().unwrap())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn downloads_page_served() -> anyhow::Result<()> {
	let mut app = updater(unreachable_s3());

	let req = make_req("/downloads").method(Method::GET).body(Body::empty()).unwrap();
	let res = app.call(req).await.unwrap();

	assert2::check!(res.status() == StatusCode::OK);

	let content_type = res
		.headers()
		.get("content-type")
		.and_then(|v| v.to_str().ok())
		.unwrap_or_default()
		.to_string();
	assert2::check!(content_type.starts_with("text/html"));

	let bytes = to_bytes(res.into_body(), usize::MAX).await?;
	let body = String::from_utf8(bytes.to_vec())?;
	assert2::check!(body.contains("Gramax"));
	assert2::check!(body.contains("id=\"channel\""));

	Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn versions_returns_bad_gateway_when_s3_unreachable() -> anyhow::Result<()> {
	let mut app = updater(unreachable_s3());

	let req = make_req("/versions?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
	let res = app.call(req).await.unwrap();

	assert2::check!(res.status() == StatusCode::BAD_GATEWAY);

	Ok(())
}
