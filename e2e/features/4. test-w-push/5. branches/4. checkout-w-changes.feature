# language: ru
Функция: Переключение с изменениями

  # Сценарий: Создание изменений
  #   Пусть смотрим на "левую навигацию"
  #   И нажимаем на кнопку "Тест"
  #   И заново смотрим на редактор
  #   Когда нажимаем на клавиши "Control+A X"
  #   Тогда разметка текущей статьи содержит
  #     """
  #     X
  #     """

  # Сценарий: Переключение на ветку
  #   Пусть смотрим на "левую панель"
  #   И смотрим на "нижнюю панель"
  #   Когда смотрим на активную вкладку
  #   Тогда нажимаем на кнопку "dev"

  # Сценарий: Проверка текущей ветки
  #   Пусть смотрим на "левую навигацию"
  #   И нажимаем на кнопку "Тест"
  #   И заново смотрим на "левую панель"
  #   И смотрим на "нижнюю панель"
  #   Тогда видим текст "dev"
  #   И разметка текущей статьи содержит
  #     """
  #     X
  #     """
