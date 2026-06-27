'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAuth } from '../../lib/providers';

interface Action {
  id: string;
  label: string;
  group: string;
  href: string;
  any: string[];
}

const ACTIONS: Action[] = [
  { id: 'go-dashboard', label: 'Go to dashboard', group: 'Navigation', href: '/', any: ['*'] },
  {
    id: 'go-products',
    label: 'Go to products',
    group: 'Navigation',
    href: '/catalog/products',
    any: ['catalog:read'],
  },
  {
    id: 'go-orders',
    label: 'Go to orders',
    group: 'Navigation',
    href: '/orders',
    any: ['orders:read'],
  },
  {
    id: 'go-customers',
    label: 'Go to customers',
    group: 'Navigation',
    href: '/customers',
    any: ['customers:read'],
  },
  {
    id: 'go-cms',
    label: 'Go to CMS pages',
    group: 'Navigation',
    href: '/cms/pages',
    any: ['cms:read'],
  },
  {
    id: 'go-flags',
    label: 'Go to feature flags',
    group: 'Operations',
    href: '/operations/flags',
    any: ['system:flags'],
  },
  {
    id: 'go-audit',
    label: 'Go to audit log',
    group: 'Operations',
    href: '/operations/audit',
    any: ['system:audit'],
  },
  {
    id: 'go-queues',
    label: 'Go to queues',
    group: 'Operations',
    href: '/operations/queues',
    any: ['system:audit'],
  },
];

/**
 * ⌘K command palette. Lightweight by design: it indexes navigation actions
 * declared at module scope, filters by the user's permissions, and matches
 * on substring. A full fuzzy-search + remote object index lands in Stage 14.
 */
export function CommandPalette() {
  const router = useRouter();
  const { can } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const visible = React.useMemo(
    () =>
      ACTIONS.filter((a) => can(...a.any)).filter((a) =>
        a.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, can],
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setCursor(0);
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function run(action: Action) {
    setOpen(false);
    router.push(action.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(visible.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      const action = visible[cursor];
      if (action) run(action);
    }
  }

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-32"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-canvas border-default w-full max-w-lg overflow-hidden rounded-md border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-default flex items-center gap-2 border-b px-3 py-2">
          <Search width={16} height={16} aria-hidden className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            className="font-body text-body-sm w-full bg-transparent focus-visible:outline-none"
            aria-label="Command"
          />
          <kbd className="text-caption text-muted">Esc</kbd>
        </div>
        <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
          {visible.length === 0 && <li className="text-muted px-3 py-2 text-sm">No matches.</li>}
          {visible.map((a, i) => (
            <li
              key={a.id}
              role="option"
              aria-selected={i === cursor}
              onMouseEnter={() => setCursor(i)}
              onClick={() => run(a)}
              className={
                'flex cursor-pointer items-center justify-between px-3 py-2 text-sm ' +
                (i === cursor ? 'bg-primary-subtle text-primary' : 'text-secondary')
              }
            >
              <span>{a.label}</span>
              <span className="text-caption text-muted">{a.group}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
