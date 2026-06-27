'use client';

import { Button, Cluster, Stack, Text } from '@offisdesign/ui';
import type { Product, Variant } from '../../lib/api/schemas';

interface Props {
  product: Product;
  activeVariantId: string;
  onChange: (variantId: string) => void;
}

/**
 * Variant picker. Renders one button-group per declared option (e.g. Wood,
 * Size). Clicking a value flips to the first variant matching the new
 * combination — if no exact match exists, falls back to the closest variant
 * by partial option overlap.
 */
export function VariantPicker({ product, activeVariantId, onChange }: Props) {
  if (product.options.length === 0) return null;
  const active = product.variants.find((v) => v.id === activeVariantId) ?? product.variants[0];
  if (!active) return null;

  function pickByOptionValue(optionValueId: string): Variant | undefined {
    const sameOption = product.options.find((opt) =>
      opt.values.some((v) => v.id === optionValueId),
    );
    if (!sameOption) return undefined;
    const activeOtherOptionIds = (active?.options ?? [])
      .map((o) => o.optionValueId)
      .filter((id) => !sameOption.values.some((v) => v.id === id));
    return (
      product.variants.find((variant) => {
        const ids = (variant.options ?? []).map((o) => o.optionValueId);
        return ids.includes(optionValueId) && activeOtherOptionIds.every((id) => ids.includes(id));
      }) ??
      product.variants.find((variant) =>
        (variant.options ?? []).some((o) => o.optionValueId === optionValueId),
      )
    );
  }

  return (
    <Stack gap={3}>
      {product.options.map((option) => {
        const activeValueId = active?.options?.find((o) =>
          option.values.some((v) => v.id === o.optionValueId),
        )?.optionValueId;
        return (
          <Stack key={option.id} gap={2}>
            <Text className="text-secondary font-semibold">{option.name}</Text>
            <Cluster gap={2}>
              {option.values.map((value) => {
                const isActive = value.id === activeValueId;
                const target = pickByOptionValue(value.id);
                return (
                  <Button
                    key={value.id}
                    size="sm"
                    variant={isActive ? 'primary' : 'outline'}
                    disabled={!target}
                    onClick={() => {
                      if (target) onChange(target.id);
                    }}
                  >
                    {value.label}
                  </Button>
                );
              })}
            </Cluster>
          </Stack>
        );
      })}
    </Stack>
  );
}
