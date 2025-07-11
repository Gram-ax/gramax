# language: ru
Функция: Мерж с конфликтом

  # Сценарий: Создание коммита
  #   Пусть смотрим на "левую панель"
  #   И смотрим на "нижнюю панель"
  #   Когда нажимаем на иконку "облачка"
  #   И видим форму "публикация" без заголовка
  #   И смотрим на активную форму
  #   И смотрим на "левую панель"
  #   И видим текст "test1.md"
  #   Тогда нажимаем на кнопку "Опубликовать"
  #   И смотрим на активную форму
  #   И ждём конца загрузки

  # Сценарий: Переход на ветку master
  #   Пусть смотрим на "левую панель"
  #   И смотрим на "нижнюю панель"
  #   Когда смотрим на активную вкладку
  #   Тогда нажимаем на кнопку "master"

  # Сценарий: Создание изменений
  #   Пусть смотрим на "левую навигацию"
  #   И нажимаем на кнопку "Тест"
  #   И заново смотрим на редактор
  #   Когда нажимаем на клавиши "Control+A M"
  #   Тогда разметка текущей статьи содержит
  #     """
  #     M
  #     """
  #   И перезагружаем страницу

  # Сценарий: Создание коммита
  #   Пусть смотрим на "левую панель"
  #   И смотрим на "нижнюю панель"
  #   Когда нажимаем на иконку "облачка"
  #   И видим форму "публикация" без заголовка
  #   И смотрим на активную форму
  #   И смотрим на "левую панель"
  #   И видим текст "test1.md"
  #   Тогда нажимаем на кнопку "Опубликовать"
  #   И смотрим на активную форму
  #   И ждём конца загрузки

  # Сценарий: Открытие меню переключения веток
  #   Пусть смотрим на "левую панель"
  #   И смотрим на "нижнюю панель"
  #   Когда нажимаем на элемент "смена ветки"
  #   И смотрим на активную вкладку
  #   И наводимся на кнопку "dev"
  #   И наводим мышку
  #   И нажимаем на иконку "вертикальные три точки"
  #   И смотрим на подсказку
  #   И нажимаем на кнопку "Слить"
  #   Тогда видим форму "Слить ветки"

  # Сценарий: Слияние веток
  #   Пусть смотрим на активную форму
  #   Когда нажимаем на кнопку "Слить"
  #   Тогда ждём конца загрузки

  # Сценарий: Решение конфликта
  #   Пусть ожидаем ошибку
  #   И смотрим на активную форму
  #   И перезагружаем страницу
  #   Пусть ожидаем ошибку
  #   И смотрим на активную форму
  #   Когда нажимаем на кнопку "Решить конфликт"
  #   И не ожидаем ошибку
  #   И ждём конца загрузки
  #   И решаем конфликт
  #   И смотрим на активную форму
  #   И смотрим на "левую панель"
  #   И нажимаем на кнопку "Подтвердить"
  #   И смотрим на активную форму
  #   И ждём конца загрузки
  #   Когда заново смотрим на "левую навигацию"
  #   И нажимаем на кнопку "Тест"
  #   И нажимаем на кнопку "Без названия"
  #   И нажимаем на кнопку "Тест"
  #   И разметка текущей статьи содержит
  #     """
  #     M
  #     """
