import { renderTemplate } from './template';

describe('renderTemplate', () => {
  it('substitutes top-level keys', () => {
    expect(renderTemplate('Hello {{ name }}', { name: 'Mayowa' })).toBe('Hello Mayowa');
  });

  it('substitutes nested keys', () => {
    expect(
      renderTemplate('Order #{{ order.number }} for {{ order.email }}', {
        order: { number: 'OD-202603-ABCDEFG', email: 'jane@example.com' },
      }),
    ).toBe('Order #OD-202603-ABCDEFG for jane@example.com');
  });

  it('renders missing keys as empty strings', () => {
    expect(renderTemplate('a={{ a }}|b={{ b }}', { a: 'x' })).toBe('a=x|b=');
  });

  it('JSON-serialises non-string values', () => {
    expect(renderTemplate('{{ data }}', { data: { ok: 1 } })).toBe('{"ok":1}');
  });

  it('preserves text without placeholders', () => {
    expect(renderTemplate('plain text', { x: 1 })).toBe('plain text');
  });
});
