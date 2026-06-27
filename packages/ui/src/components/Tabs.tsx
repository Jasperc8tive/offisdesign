import * as React from 'react';
import { cn } from '../internal/cn';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be rendered inside <Tabs>');
  return ctx;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value: valueProp,
  onValueChange,
  className,
  children,
  ...rest
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const value = valueProp ?? internal;
  const setValue = React.useCallback(
    (v: string) => {
      if (valueProp === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [valueProp, onValueChange],
  );
  const baseId = React.useId();
  const ctx = React.useMemo(() => ({ value, setValue, baseId }), [value, setValue, baseId]);
  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn('font-body', className)} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function TabList({ label, className, children, ...rest }: TabListProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('border-border flex border-b', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, className, children, ...rest },
  ref,
) {
  const { value: active, setValue, baseId } = useTabs();
  const selected = value === active;
  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        'text-body-sm duration-base focus-visible:ring-primary -mb-px border-b-2 px-4 py-3 font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2',
        selected
          ? 'border-primary text-primary'
          : 'text-muted hover:text-secondary border-transparent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabPanel({ value, className, children, ...rest }: TabPanelProps) {
  const { value: active, baseId } = useTabs();
  if (value !== active) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className={cn('pt-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
