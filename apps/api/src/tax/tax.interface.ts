export interface TaxableLine {
  variantId: string;
  productId: string;
  unitAmount: number;
  quantity: number;
  /** ISO-3166-1 alpha-2 destination. */
  countryCode: string;
  region?: string;
  /** Optional product-level tax category for region-specific rules. */
  taxCategory?: string;
}

export interface TaxRequest {
  currency: string;
  lines: TaxableLine[];
  shippingAmount: number;
  destinationCountry: string;
  destinationRegion?: string;
}

export interface TaxLine {
  variantId: string;
  taxableAmount: number;
  taxAmount: number;
  rateBps: number;
}

export interface TaxQuote {
  currency: string;
  lines: TaxLine[];
  shippingTaxAmount: number;
  totalTax: number;
}

export interface TaxService {
  readonly name: string;
  calculate(req: TaxRequest): Promise<TaxQuote>;
}

export const TAX_SERVICE = Symbol('TAX_SERVICE');
