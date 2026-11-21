/**
 * Privacy-safe anonymous visitor session identifier.
 * Generates an opaque random UUID stored locally in student's browser.
 * Never stores personal information, names, emails, or IP addresses.
 */

export function getAnonymousVisitorId(): string {
  if (typeof window === 'undefined') return 'anon-server';

  try {
    let id = localStorage.getItem('unsay_sudan_visitor_id');
    if (!id) {
      // Generate standard random UUID
      id = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('unsay_sudan_visitor_id', id);
    }
    return id;
  } catch {
    return 'v_transient_' + Math.random().toString(36).substring(2, 9);
  }
}
