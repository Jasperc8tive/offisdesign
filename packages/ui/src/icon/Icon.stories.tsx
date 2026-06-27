import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight, Heart, Search, ShoppingBag, User } from 'lucide-react';
import { Icon } from './Icon';

const meta: Meta<typeof Icon> = { title: 'Foundation/Icon', component: Icon };
export default meta;
type Story = StoryObj<typeof Icon>;

export const Sizes: Story = {
  render: () => (
    <div className="text-secondary flex items-end gap-6 p-8">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <Icon icon={ArrowRight} size={s} title={`arrow ${s}`} />
          <span className="text-caption text-muted">{s}</span>
        </div>
      ))}
    </div>
  ),
};

export const Set: Story = {
  render: () => (
    <div className="text-primary flex gap-6 p-8">
      <Icon icon={Search} title="Search" />
      <Icon icon={ShoppingBag} title="Cart" />
      <Icon icon={Heart} title="Wishlist" />
      <Icon icon={User} title="Account" />
    </div>
  ),
};

export const Decorative: Story = {
  render: () => (
    <div className="text-secondary flex items-center gap-2 p-8">
      <Icon icon={ArrowRight} decorative />
      <span>Decorative icon, hidden from screen readers</span>
    </div>
  ),
};
