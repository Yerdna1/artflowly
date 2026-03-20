export function debounce<A extends unknown[], R>(
  func: (...args: A) => R,
  wait: number
): ((...args: A) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = function(...args: A) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
