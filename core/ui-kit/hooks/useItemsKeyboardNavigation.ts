import { type KeyboardEvent, useCallback, useEffect, useState } from "react";

/**
 * Хук для навигации по элементам с помощью клавиатуры
 *
 * @example
 * ```tsx
 * function TagList({ tags, onTagSelect, onTagDelete }) {
 *   const containerRef = useRef(null);
 *
 *   const {
 *     focusedIndex,
 *     handleKeyDown,
 *     handleFocus,
 *     handleBlur,
 *     isFocused
 *   } = useItemsKeyboardNavigation({
 *     items: tags,
 *     onEnter: onTagSelect,
 *     onDelete: onTagDelete
 *   });
 *
 *   return (
 *     <div
 *       ref={containerRef}
 *       tabIndex={0}
 *       onKeyDown={handleKeyDown}
 *       onFocus={handleFocus}
 *       onBlur={handleBlur}
 *     >
 *       {tags.map((tag, index) => (
 *         <div key={tag.id} className={isFocused(index) ? "focused" : ""}>
 *           {tag.label}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useItemsKeyboardNavigation<T>({
	items,
	onEnter,
	onDelete,
	cycleNavigation = false,
}: {
	/** Массив элементов для навигации */
	items: T[];
	/** Функция, вызываемая при нажатии Enter на элементе */
	onEnter?: (item: T, index: number) => void;
	/** Функция, вызываемая при нажатии Delete/Backspace на элементе */
	onDelete?: (item: T, index: number) => void;
	/** Включает циклическую навигацию (с последнего элемента на первый и наоборот) */
	cycleNavigation?: boolean;
}) {
	/** Индекс текущего элемента с фокусом */
	const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

	/**
	 * Следим за изменениями в items и корректируем focusedIndex при необходимости
	 */
	useEffect(() => {
		if (focusedIndex !== null && items.length > 0) {
			// Если текущий индекс выходит за границы массива
			if (focusedIndex >= items.length) {
				// Устанавливаем индекс на последний элемент
				setFocusedIndex(items.length - 1);
			}
		} else if (items.length === 0) {
			// Если элементов нет, сбрасываем фокус
			setFocusedIndex(null);
		} else if (focusedIndex === null && items.length > 0) {
			setFocusedIndex(0);
		}
	}, [items, focusedIndex]);

	/**
	 * Обработчик нажатия клавиш для навигации по элементам
	 */
	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLElement>) => {
			// Проверяем, есть ли элементы для навигации
			if (!items.length) return;

			switch (e.key) {
				case "ArrowLeft":
					e.preventDefault();
					setFocusedIndex((prev) => {
						if (prev === null) return 0;
						if (prev > 0) return prev - 1;
						return cycleNavigation ? items.length - 1 : prev;
					});
					break;

				case "ArrowRight":
					e.preventDefault();
					setFocusedIndex((prev) => {
						if (prev === null) return 0;
						if (prev < items.length - 1) return prev + 1;
						return cycleNavigation ? 0 : prev;
					});
					break;

				case "Home":
					e.preventDefault();
					setFocusedIndex(0);
					break;

				case "End":
					e.preventDefault();
					setFocusedIndex(items.length - 1);
					break;

				case "Enter":
					if (focusedIndex !== null && items[focusedIndex] && onEnter) {
						e.preventDefault();
						onEnter(items[focusedIndex], focusedIndex);
					}
					break;

				case "Delete":
				case "Backspace":
					if (focusedIndex !== null && items[focusedIndex] && onDelete) {
						e.preventDefault();

						// Сохраняем текущий индекс перед удалением
						const currentIndex = focusedIndex;

						onDelete(items[focusedIndex], focusedIndex);

						// Корректируем индекс после удаления
						// Это сработает корректно, если items обновится синхронно
						// В противном случае, корректировку нужно делать в эффекте
						if (currentIndex >= items.length - 1) {
							setFocusedIndex(Math.max(0, items.length - 2));
						}
					}
					break;

				default:
					break;
			}
		},
		[items, focusedIndex, onEnter, onDelete, cycleNavigation],
	);

	/**
	 * Обработчик получения фокуса контейнером
	 */
	const handleFocus = useCallback(() => {
		if (items.length) {
			setFocusedIndex(0);
		}
	}, [items]);

	/**
	 * Обработчик потери фокуса контейнером
	 */
	const handleBlur = useCallback(() => {
		setFocusedIndex(null);
	}, []);

	/**
	 * Проверяет, находится ли элемент с указанным индексом в фокусе
	 */
	const isFocused = useCallback((index: number) => focusedIndex === index, [focusedIndex]);

	/**
	 * Безопасно устанавливает фокус на элемент по индексу
	 * @param index Индекс элемента для фокусировки
	 * @returns Возвращает true, если индекс был установлен успешно
	 */
	const focusItemAtIndex = useCallback(
		(index: number) => {
			if (index >= 0 && index < items.length) {
				setFocusedIndex(index);
				return true;
			}
			return false;
		},
		[items.length],
	);

	return {
		focusedIndex,
		handleKeyDown,
		handleFocus,
		handleBlur,
		isFocused,
		focusItemAtIndex,
	};
}
