/* eslint-disable @typescript-eslint/no-unused-expressions */
export type Theme = "light" | "dark" | "system";

let _mediaListener: (() => void) | null = null;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // Guardar escolha
  localStorage.setItem("lh_theme", theme);

  // Remover listener anterior de sistema, se existir
  if (_mediaListener) {
    window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", _mediaListener);
    _mediaListener = null;
  }

  if (theme === "light") {
    root.classList.remove("dark");
  } else if (theme === "dark") {
    root.classList.add("dark");
  } else {
    // system — neste produto queremos que 'system' signifique tema claro
    // Aplicar claro e não escutar alterações do OS
    root.classList.remove("dark");
  }
}