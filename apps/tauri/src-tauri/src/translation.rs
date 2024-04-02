use std::str::FromStr;

#[derive(Clone, Copy, Default)]
pub enum Language {
  #[default]
  Russian,
  English,
}

#[derive(Clone, Copy, Default)]
pub enum Translation {
  #[default]
  Unknown,

  Settings,
  NewWindow,
  CloseWindow,
  CheckUpdate,
  Quit,
  Hide,
  About,

  CheckingForUpdate,
  UpdateDownloading,
  YouHaveActualVersion,
  YouHaveActualVersionBody,
  UpdateNow,
  UpdateNowBody,
  DeclineUpdate,
  NewerUpdateFound,
  ErrorWhileUpdating,
  TryLater,
  NewVersion,
  UpdateOk,
}

#[cfg(desktop)]
impl From<crate::platform::menu::MenuItemId> for Translation {
  fn from(value: crate::platform::menu::MenuItemId) -> Self {
    use crate::platform::menu::MenuItemId as Id;

    match value {
      Id::CheckUpdate => Self::CheckUpdate,
      Id::Settings => Self::Settings,
      Id::NewWindow => Self::NewWindow,
      Id::CloseWindow => Self::CloseWindow,
      _ => Self::Unknown,
    }
  }
}

impl FromStr for Translation {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    #[allow(clippy::match_single_binding)]
    let key = match s {
      _ => Self::Unknown,
    };

    Ok(key)
  }
}

impl ToString for Language {
  fn to_string(&self) -> String {
    match self {
      Self::Russian => "ru",
      Self::English => "en",
    }
    .into()
  }
}

pub trait Translator {
  fn detect_user_language() -> Self;
  fn decide<S: AsRef<str>>(&self, en: S, ru: S) -> S;
  fn translate(&self, key: Translation) -> Box<str>;
}

impl Translator for Language {
  fn detect_user_language() -> Self {
    let locale = sys_locale::get_locale();
    let locale = locale.as_deref().and_then(|locale| locale.split('-').next());

    match locale {
      Some("en") => Language::English,
      _ => Language::default(),
    }
  }

  fn decide<S: AsRef<str>>(&self, en: S, ru: S) -> S {
    match self {
      Language::Russian => ru,
      Language::English => en,
    }
  }

  fn translate(&self, key: Translation) -> Box<str> {
    use Translation as T;
    let matched = match key {
      T::Unknown => "???",
      T::Settings => self.decide("Settings...", "Настройки..."),
      T::CheckUpdate => self.decide("Check for updates...", "Проверить обновления..."),
      T::Quit => self.decide("Quit", "Закрыть"),
      T::Hide => self.decide("Hide", "Скрыть"),
      T::About => self.decide("About", "О программе"),
      T::YouHaveActualVersion => self.decide("You have the latest version", "У вас актуальная версия!"),
      T::YouHaveActualVersionBody => {
        self.decide("We'll let you know when a new one is available.", "Мы сообщим, когда выйдет новая.")
      }
      T::UpdateNow => self.decide("Update Now", "Обновить сейчас"),
      T::UpdateNowBody => self.decide(
        "Click «Update Now» and the application will restart.",
        "Нажмите «Обновить сейчас» и приложение перезапустится.",
      ),
      T::DeclineUpdate => self.decide("Later", "Позже"),
      T::ErrorWhileUpdating => self.decide("Failed to update the application", "Не удалось обновить приложение"),
      T::TryLater => self.decide("Please try again later", "Попробуйте позже"),
      T::NewVersion => self.decide("New Version!", "Новая версия!"),
      T::UpdateOk => self.decide("Ok", "Понятно"),
      T::CheckingForUpdate => self.decide("Checking...", "Проверяем..."),
      T::UpdateDownloading => self.decide("Downloading...", "Загружаем..."),
      T::NewWindow => self.decide("New Window", "Новое окно"),
      T::CloseWindow => self.decide("Close Window", "Закрыть окно"),
      T::NewerUpdateFound => self.decide(
        "Newer update was found. It will be downloaded in the background, after which the application will restart.", 
        "Найдена более новая версия приложения. Оно будет скачано в фоновом режиме, после чего приложение перезапустится."
      )
      // "file" => self.decide("File", "Файл"),
      // "help" => self.decide("Help", "Справка"),
      // "edit" => self.decide("Edit", "Правка"),
      // "copy" => self.decide("Copy", "Скопировать"),
      // "cut" => self.decide("Cut", "Вырезать"),
      // "paste" => self.decide("Paste", "Вставить"),
      // "window" => self.decide("Window", "Окно"),
      // "fullscreen" => self.decide("Fullscreen", "Полный экран"),
      // "maximize" => self.decide("Maximize", "Развернуть"),
      // "minimize" => self.decide("Minimize", "Свернуть"),
    };

    Box::from(matched)
  }
}
