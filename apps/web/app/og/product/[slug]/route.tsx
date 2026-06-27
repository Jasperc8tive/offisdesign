import { ImageResponse } from 'next/og';
import { catalogService } from '../../../../lib/api/services';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

/**
 * Dynamic Open Graph image for product pages. Renders a brand-coloured card
 * with the product name and "from" price. We avoid loading external fonts at
 * the edge — the ImageResponse default sans-serif is good enough for OG.
 */
export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let name = 'Offisdesign';
  let price = '';
  let brand = 'Built in Britain';

  try {
    const product = await catalogService.product(slug);
    name = product.name;
    if (product.brand) brand = product.brand;
    const variant = product.variants[0];
    if (variant) {
      const major = (variant.priceAmount / 100).toFixed(0);
      price = `From £${major}`;
    }
  } catch {
    // Use defaults; the fetch may fail at build time.
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        background: '#FEFEFE',
        color: '#410C14',
        fontFamily: 'serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 9999,
            background: '#B81F34',
          }}
        />
        <div style={{ fontSize: 36, letterSpacing: 1, textTransform: 'uppercase' }}>
          Offisdesign
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 32, color: '#7B404B' }}>{brand}</div>
        <div style={{ fontSize: 96, lineHeight: 1.05, fontWeight: 600 }}>{name}</div>
        {price && <div style={{ fontSize: 36, color: '#B81F34', fontWeight: 600 }}>{price}</div>}
      </div>
      <div
        style={{
          fontSize: 24,
          color: '#7B404B',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>offisdesign.com</div>
        <div>Furniture made to outlast trends</div>
      </div>
    </div>,
    { width: size.width, height: size.height },
  );
}
