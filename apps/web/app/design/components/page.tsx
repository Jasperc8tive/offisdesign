'use client';

import { useState } from 'react';
import { ArrowRight, Heart, Inbox, Search, ShoppingBag } from 'lucide-react';
import {
  Alert,
  AspectRatio,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Cluster,
  Container,
  Display,
  Divider,
  EmptyState,
  FormField,
  Grid,
  Heading,
  Icon,
  Input,
  Label,
  NavLink,
  Pagination,
  PriceTag,
  Progress,
  Quantity,
  Radio,
  Rating,
  Select,
  Skeleton,
  Spinner,
  Stack,
  Swatch,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  Text,
  Textarea,
  Tooltip,
} from '@offisdesign/ui';

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <Stack gap={4}>
        <Heading level={2} id={`${id}-h`}>
          {title}
        </Heading>
        <Divider />
        <div>{children}</div>
      </Stack>
    </section>
  );
}

export default function Showcase() {
  const [q, setQ] = useState(1);
  const [swatch, setSwatch] = useState('oak');
  const [news, setNews] = useState(true);
  const [shipping, setShipping] = useState('standard');
  const [page, setPage] = useState(3);

  const toc = [
    ['typography', 'Typography'],
    ['layout', 'Layout primitives'],
    ['atomics', 'Atomics'],
    ['navigation', 'Navigation'],
    ['commerce', 'Commerce'],
    ['forms', 'Forms'],
    ['feedback', 'Feedback'],
  ] as const;

  return (
    <Stack gap={16}>
      <Stack gap={3}>
        <Badge variant="muted">Showcase</Badge>
        <Heading level={1}>UI Component Showcase</Heading>
        <Text tone="muted">
          Every reusable component from the design system, rendered together so we can validate
          coherence across the surface.
        </Text>
        <Cluster gap={2}>
          {toc.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="border-border-strong font-body text-body-sm text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus rounded-sm border px-3 py-1 transition-colors focus-visible:outline-none"
            >
              {label}
            </a>
          ))}
        </Cluster>
      </Stack>

      <Section id="typography" title="Typography">
        <Stack gap={4}>
          <Display size="lg">Branch.</Display>
          <Heading level={1}>Heading 1 — Frank Ruhl Libre</Heading>
          <Heading level={2}>Heading 2</Heading>
          <Heading level={3}>Heading 3</Heading>
          <Heading level={4}>Heading 4</Heading>
          <Text>Body — Quicksand at 16px / 1.6.</Text>
          <Text size="sm" tone="muted">
            Small muted text — metadata, captions, helper.
          </Text>
          <Text size="caption" tone="muted">
            Caption — 12px floor.
          </Text>
        </Stack>
      </Section>

      <Section id="layout" title="Layout primitives">
        <Stack gap={6}>
          <div>
            <Text size="sm" tone="muted">
              Container (1120 max, 24/64 gutters)
            </Text>
            <Container className="border-border-strong mt-2 rounded-sm border border-dashed p-4">
              <Text>Content lives inside</Text>
            </Container>
          </div>
          <div>
            <Text size="sm" tone="muted">
              Grid (3 cols, gap 4)
            </Text>
            <Grid cols={3} gap={4} className="mt-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-primary-subtle text-secondary rounded-sm p-4">
                  Cell {n}
                </div>
              ))}
            </Grid>
          </div>
          <div>
            <Text size="sm" tone="muted">
              Cluster, Stack, Divider, AspectRatio
            </Text>
            <Stack gap={3} className="mt-2">
              <Cluster gap={3}>
                <Tag>One</Tag>
                <Tag>Two</Tag>
                <Tag>Three</Tag>
              </Cluster>
              <Divider />
              <AspectRatio ratio={16 / 9} className="bg-primary-subtle max-w-md rounded-md">
                <div className="text-secondary flex h-full w-full items-center justify-center">
                  16 / 9
                </div>
              </AspectRatio>
            </Stack>
          </div>
        </Stack>
      </Section>

      <Section id="atomics" title="Atomics">
        <Stack gap={6}>
          <Cluster gap={3}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button leadingIcon={<ShoppingBag width={16} height={16} aria-hidden />}>
              Add to bag
            </Button>
            <Button trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
              Continue
            </Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </Cluster>
          <Cluster gap={3} align="center">
            <Badge>New</Badge>
            <Badge variant="secondary">Featured</Badge>
            <Badge variant="outline">Limited</Badge>
            <Badge variant="muted">Sale</Badge>
            <Tag onRemove={() => undefined}>Oak</Tag>
            <Avatar initials="MD" alt="Mayowa D." />
            <Avatar initials="JS" size="lg" alt="Jane S." />
          </Cluster>
          <Grid cols={2} gap={4}>
            <Card>
              <CardHeader>
                <Heading level={4}>Static card</Heading>
                <Text size="sm" tone="muted">
                  Grouping with subtle elevation.
                </Text>
              </CardHeader>
              <CardBody>
                <Text>Card content.</Text>
              </CardBody>
              <CardFooter>
                <Text size="sm" tone="muted">
                  Footer
                </Text>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardBody>
                <Stack gap={2}>
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-24 w-full" rounded="md" />
                </Stack>
              </CardBody>
            </Card>
          </Grid>
        </Stack>
      </Section>

      <Section id="navigation" title="Navigation">
        <Stack gap={6}>
          <Cluster gap={8}>
            <NavLink href="#" active>
              Shop
            </NavLink>
            <NavLink href="#">Collections</NavLink>
            <NavLink href="#">Journal</NavLink>
            <NavLink href="#">About</NavLink>
          </Cluster>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '#' },
              { label: 'Sofas', href: '#' },
              { label: 'Branch 3-seater' },
            ]}
          />
          <Tabs defaultValue="details">
            <TabList label="Product info">
              <Tab value="details">Details</Tab>
              <Tab value="materials">Materials</Tab>
              <Tab value="delivery">Delivery</Tab>
            </TabList>
            <TabPanel value="details">
              <Text>Details panel.</Text>
            </TabPanel>
            <TabPanel value="materials">
              <Text>Materials panel.</Text>
            </TabPanel>
            <TabPanel value="delivery">
              <Text>Delivery panel.</Text>
            </TabPanel>
          </Tabs>
          <Pagination page={page} pageCount={12} onPageChange={setPage} />
        </Stack>
      </Section>

      <Section id="commerce" title="Commerce">
        <Stack gap={6}>
          <Cluster gap={6} align="center">
            <PriceTag amount={129900} />
            <PriceTag amount={89900} originalAmount={129900} />
            <PriceTag amount={250000} size="lg" />
          </Cluster>
          <Cluster gap={6} align="center">
            <Quantity value={q} onChange={setQ} />
            <Rating value={4.5} reviewCount={128} />
          </Cluster>
          <Swatch
            name="Wood"
            value={swatch}
            onChange={setSwatch}
            options={[
              { value: 'oak', label: 'Oak', color: '#C9A66B' },
              { value: 'walnut', label: 'Walnut', color: '#5C3A21' },
              { value: 'ash', label: 'Ash', color: '#E8DCC2' },
              { value: 'black', label: 'Black', color: '#1A1A1A' },
            ]}
          />
        </Stack>
      </Section>

      <Section id="forms" title="Forms">
        <Grid cols={2} gap={6}>
          <Stack gap={4}>
            <FormField label="Full name" htmlFor="name" required>
              <Input id="name" placeholder="Jane Doe" />
            </FormField>
            <FormField label="Search" htmlFor="q" helperText="Searches title and description.">
              <Input
                id="q"
                placeholder="Search products…"
                leadingIcon={<Search width={16} height={16} aria-hidden />}
              />
            </FormField>
            <FormField label="Email" htmlFor="email" errorText="Enter a valid email.">
              <Input id="email" invalid value="not-an-email" onChange={() => undefined} />
            </FormField>
            <FormField label="Notes" htmlFor="notes">
              <Textarea id="notes" placeholder="Anything we should know?" />
            </FormField>
            <FormField label="Country" htmlFor="country">
              <Select id="country" defaultValue="GB">
                <option value="GB">United Kingdom</option>
                <option value="IE">Ireland</option>
                <option value="FR">France</option>
              </Select>
            </FormField>
          </Stack>
          <Stack gap={4}>
            <Label>Choices</Label>
            <Checkbox label="Subscribe to newsletter" defaultChecked />
            <div role="radiogroup" aria-label="Shipping" className="flex flex-col gap-2">
              <Radio
                label="Standard (3–5 days)"
                name="shipping"
                value="standard"
                checked={shipping === 'standard'}
                onChange={(e) => setShipping(e.target.value)}
              />
              <Radio
                label="Express (1–2 days)"
                name="shipping"
                value="express"
                checked={shipping === 'express'}
                onChange={(e) => setShipping(e.target.value)}
              />
            </div>
            <Switch checked={news} onCheckedChange={setNews} label="Email me about restocks" />
          </Stack>
        </Grid>
      </Section>

      <Section id="feedback" title="Feedback">
        <Stack gap={4}>
          <Alert variant="info" title="Free delivery over £500">
            Standard UK shipping, 3–5 working days.
          </Alert>
          <Alert variant="success" title="Saved" onDismiss={() => undefined}>
            Your changes were saved.
          </Alert>
          <Alert variant="warning" title="Heads up">
            Stock is running low — only 2 left.
          </Alert>
          <Alert variant="error" title="Something went wrong">
            Please try again.
          </Alert>
          <Cluster gap={6} align="center">
            <Tooltip content="With a tooltip" side="top">
              <Button variant="outline">
                <Icon icon={Heart} decorative /> Save
              </Button>
            </Tooltip>
            <Spinner />
            <Progress value={62} label="Upload" className="w-48" />
          </Cluster>
          <EmptyState
            icon={<Inbox width={32} height={32} aria-hidden />}
            title="No saved items yet"
            description="Heart products as you browse to save them here."
            action={<Button>Start browsing</Button>}
          />
        </Stack>
      </Section>
    </Stack>
  );
}
