const CANONICAL_STYLESHEET = '/imperial-design-system.css';

/**
 * Make the unified design system the only stylesheet entry point for every
 * Worker-rendered HTML shell. The consolidated stylesheet contains the
 * legacy page-family rules, so retaining old stylesheet links creates a
 * second, order-dependent styling stack.
 */
export function applyCanonicalStylesheet(html) {
  if (typeof html !== 'string' || !html.includes('</head>')) {
    throw new TypeError('Expected an HTML document with a closing head element.');
  }

  const withoutStylesheetLinks = html.replace(
    /<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])[^>]*>/gi,
    ''
  );
  const canonicalLink = '<link rel="stylesheet" href="' + CANONICAL_STYLESHEET + '">';
  return withoutStylesheetLinks.replace('</head>', canonicalLink + '</head>');
}
