import { ProductPageAccordion } from '@/components/molecules';

export const ProductDetailsShipping = () => {
  return (
    <ProductPageAccordion
      heading='Shipping & Returns'
      defaultOpen={false}
    >
      <div className='product-details'>
        <ul className='space-y-2 text-sm text-secondary'>
          <li>
            Free standard shipping on qualifying orders. Orders typically ship
            within 3–5 business days. Expedited delivery options may be selected
            at checkout.
          </li>
          <li>
            30-day return policy. If you are not completely satisfied with your
            purchase, you may return the item in its original condition and
            packaging for a refund or exchange.
          </li>
        </ul>
      </div>
    </ProductPageAccordion>
  );
};
