/**
 * Abre o diálogo de impressão do sistema (equivalente a Ctrl+P nesta página).
 *
 * Importante: deve rodar no mesmo “turno” do clique do usuário. Atrasar com
 * `requestAnimationFrame`/`setTimeout` pode fazer Chrome/Edge ignorarem a
 * impressão por falta de transient user activation.
 */
export function triggerBrowserPrint(): void {
  window.print()
}
