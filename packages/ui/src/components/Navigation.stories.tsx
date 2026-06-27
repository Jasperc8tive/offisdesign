import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NavLink } from './NavLink';
import { Breadcrumb } from './Breadcrumb';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';
import { Pagination } from './Pagination';
import { Cluster } from '../layout/Cluster';
import { Stack } from '../layout/Stack';
import { Text } from '../typography/Text';

const meta: Meta = { title: 'Components/Navigation' };
export default meta;
type Story = StoryObj;

export const NavLinks: Story = {
  render: () => (
    <Cluster gap={8} className="p-8">
      <NavLink href="#" active>
        Shop
      </NavLink>
      <NavLink href="#">Collections</NavLink>
      <NavLink href="#">Journal</NavLink>
      <NavLink href="#">About</NavLink>
    </Cluster>
  ),
};

export const Breadcrumbs: Story = {
  render: () => (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Sofas', href: '/shop/sofas' },
          { label: 'Branch 3-seater' },
        ]}
      />
    </div>
  ),
};

export const TabsExample: Story = {
  render: () => (
    <div className="p-8">
      <Tabs defaultValue="details">
        <TabList label="Product info">
          <Tab value="details">Details</Tab>
          <Tab value="materials">Materials</Tab>
          <Tab value="delivery">Delivery</Tab>
        </TabList>
        <TabPanel value="details">
          <Text>Product details panel.</Text>
        </TabPanel>
        <TabPanel value="materials">
          <Text>Materials panel.</Text>
        </TabPanel>
        <TabPanel value="delivery">
          <Text>Delivery panel.</Text>
        </TabPanel>
      </Tabs>
    </div>
  ),
};

export const PaginationExample: Story = {
  render: () => {
    const [page, setPage] = useState(4);
    return (
      <Stack gap={4} className="p-8">
        <Pagination page={page} pageCount={12} onPageChange={setPage} />
        <Text size="sm" tone="muted">
          Page {page} of 12
        </Text>
      </Stack>
    );
  },
};
