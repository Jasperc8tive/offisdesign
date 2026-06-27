import * as React from 'react';

const style: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
};

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: 'span' | 'div';
}

export const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ as: Tag = 'span', ...rest }, ref) {
    const Component = Tag as 'span';
    return <Component ref={ref} style={style} {...rest} />;
  },
);
