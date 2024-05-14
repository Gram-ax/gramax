use std::path::PathBuf;
use warp::http::header::HeaderMap;
use warp::http::header::HeaderName;
use warp::http::header::HeaderValue;
use warp::Filter;

#[tokio::main]
async fn main() {
  let path = PathBuf::from(std::env::args().nth(1).unwrap_or(".".to_string()));
  let port = match std::env::var("PORT").map(|f| f.parse::<u16>()) {
    Ok(Ok(port)) => port,
    _ => {
      println!("using default 8000 port");
      8000
    }
  };

  let index_file = path.join("index.html");

  let mut h = HeaderMap::new();
  h.insert(HeaderName::from_static("cross-origin-opener-policy"), HeaderValue::from_static("same-origin"));
  h.insert(HeaderName::from_static("cross-origin-embedder-policy"), HeaderValue::from_static("require-corp"));
  let additional_cors = warp::filters::reply::headers(h);

  let service = warp::fs::dir(path.clone()).or(warp::fs::file(index_file)).with(additional_cors);

  println!("warp started at: http://localhost:{} (listening 0.0.0.0)", port);
  println!("serving files at: {}", std::env::current_dir().unwrap().join(path).display());
  warp::serve(service).run(([0, 0, 0, 0], port)).await;
}
