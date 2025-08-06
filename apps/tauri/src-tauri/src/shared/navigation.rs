pub fn should_allow_navigation(url: &url::Url, allowed_domains: &[&str]) -> bool {
  url.scheme() == "blob"
    || url.scheme() == "tauri"
    || url.domain().is_some_and(|domain| allowed_domains.contains(&domain))
}

pub fn handle_external_url(url: &url::Url) -> bool {
  #[cfg(desktop)]
  {
    use crate::error::ShowError;
    let _ =
      open::that_detached(url.as_str()).or_show_with_message(&t!("etc.error.open-url", url = url.as_str()));
    false
  }

  #[cfg(mobile)]
  {
    crate::platform::handle_external_navigation(url)
  }

  #[cfg(not(any(desktop, mobile)))]
  false
}
