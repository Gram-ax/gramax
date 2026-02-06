use std::ops::Deref;

use axum::http::request::Builder;
use axum::Router;
use minio::s3::segmented_bytes::SegmentedBytes;
use minio::s3::types::S3Api;
use minio::s3::Client;

use spa::metrics::layers::Metrics;
use spa::updater::S3BaseUrl;

pub use axum::http::Request;
pub use rstest::rstest;

use spa::updater::Updater;
use tempdir::TempDir;

use testcontainers::core::ContainerPort;
use testcontainers::core::Mount;
use testcontainers::core::WaitFor;
use testcontainers::runners::AsyncRunner;
use testcontainers::ContainerAsync;
use testcontainers::GenericImage;
use testcontainers::ImageExt;
use tokio::sync::OnceCell;

use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

mod endpoint_download;
mod endpoint_get_exact_version;
mod endpoint_get_update;
mod endpoint_get_updates;
mod get_updates;
mod package;
mod urls;

static mut MINIO_CONTAINER: tokio::sync::OnceCell<ContainerAsync<GenericImage>> = tokio::sync::OnceCell::const_new();

static POLICY: &str = r#"{
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": [
                "s3:GetBucketLocation",
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::*"
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::*/*"
        }]
    }"#;

pub fn make_req(uri: &str) -> Builder {
	Request::builder().header("X-Real-Ip", "0.0.0.0").uri(uri)
}

pub struct S3Client {
	client: Client,
	bucket: String,
}

impl Deref for S3Client {
	type Target = Client;

	fn deref(&self) -> &Self::Target {
		&self.client
	}
}

impl S3Client {
	pub async fn new() -> Self {
		let address = get_or_create_minio_address().await;
		let provider = minio::s3::creds::StaticProvider::new("minioadmin", "minioadmin", None);

		S3Client {
			client: minio::s3::Client::new(format!("http://{}", address).parse().unwrap(), Some(Box::new(provider)), None, Some(true)).unwrap(),
			bucket: "public".to_string(),
		}
	}
	pub async fn with_uniq_bucket(self) -> Self {
		let name = format!("bucket-{}", nanoid::nanoid!(5, &('a'..='z').collect::<Vec<char>>()));
		self.create_bucket(name.clone()).send().await.unwrap();
		self.put_bucket_policy(name.clone()).config(POLICY.into()).send().await.unwrap();
		Self { bucket: name, ..self }
	}

	pub async fn put<T: Into<bytes::Bytes>>(&self, path: &str, data: T) -> anyhow::Result<()> {
		let mut bytes = SegmentedBytes::new();
		bytes.append(data.into());
		self.put_object(self.bucket.as_str(), path, bytes).send().await?;
		Ok(())
	}

	pub async fn base_url(&self) -> S3BaseUrl {
		let address = get_or_create_minio_address().await;
		S3BaseUrl(format!("http://{address}/{}", self.bucket).parse().unwrap())
	}
}

async fn get_or_create_minio_address() -> String {
	let minio_arc = unsafe {
		#[allow(static_mut_refs)]
		MINIO_CONTAINER
			.get_or_init(|| async { create_minio().await.expect("failed to create minio") })
			.await
	};
	format_minio_address(minio_arc).await
}

async fn format_minio_address(minio: &ContainerAsync<GenericImage>) -> String {
	format!("{}:{}", minio.get_host().await.unwrap(), minio.get_host_port_ipv4(9000).await.unwrap())
}

pub async fn create_minio() -> anyhow::Result<ContainerAsync<GenericImage>> {
	static MINIO_DATA_DIR: OnceCell<TempDir> = OnceCell::const_new();

	let data_dir = MINIO_DATA_DIR
		.get_or_init(|| async { TempDir::new("minio-data").unwrap() })
		.await
		.path()
		.to_path_buf();

	let container = GenericImage::new("quay.io/minio/minio", "RELEASE.2025-01-18T00-31-37Z")
		.with_wait_for(WaitFor::message_on_either_std("MinIO Object Storage Server"))
		.with_exposed_port(ContainerPort::Tcp(9000))
		.with_mount(Mount::bind_mount(data_dir.to_string_lossy().to_string(), "/data"))
		.with_cmd(["minio", "server", "--address", "0.0.0.0:9000", "/data"])
		.start()
		.await
		.expect("failed to start minio");

	let host = container.get_host().await?;
	let port = container.get_host_port_ipv4(9000).await?;

	let provider = minio::s3::creds::StaticProvider::new("minioadmin", "minioadmin", None);

	let client = minio::s3::Client::new(
		format!("http://{host}:{port}").parse().unwrap(),
		Some(Box::new(provider)),
		None,
		Some(true),
	)?;

	client.create_bucket("empty").region(None).send().await?;
	client.create_bucket("public").region(None).send().await?;

	client.put_bucket_policy("empty").config(POLICY.into()).send().await?;
	client.put_bucket_policy("public").config(POLICY.into()).send().await?;

	put_resources(&client, "public").await?;
	Ok(container)
}

async fn put_resources(client: &minio::s3::Client, bucket: &str) -> anyhow::Result<()> {
	let mut bytes = SegmentedBytes::new();
	bytes.append("1.1.1".as_bytes().into());

	client
		.put_object(bucket, "gramax/dev/latest/darwin-aarch64/gramax.darwin-aarch64.dmg.version", bytes)
		.send()
		.await?;

	let mut bytes = SegmentedBytes::new();
	bytes.append("app".as_bytes().into());

	client
		.put_object(bucket, "gramax/dev/1.1.1/darwin-aarch64/gramax.darwin-aarch64.dmg", bytes)
		.send()
		.await?;

	Ok(())
}

pub fn updater(s3_base_url: S3BaseUrl) -> Router {
	Updater {
		s3_base_url: s3_base_url.0,
		metrics: Metrics::default(),
	}
	.into_router()
}

#[ctor::ctor]
fn setup() {
	let show_output = std::env::args().any(|arg| arg == "--show-output");
	if !show_output {
		return;
	}

	tracing_subscriber::registry()
		.with(EnvFilter::new("info"))
		.with(tracing_subscriber::fmt::layer().with_ansi(true))
		.init();
}

#[ctor::dtor]
fn teardown() {
	tokio::runtime::Builder::new_multi_thread().enable_all().build().unwrap().block_on(async {
		#[allow(static_mut_refs)]
		unsafe {
			drop(MINIO_CONTAINER.take())
		};
	});
}
