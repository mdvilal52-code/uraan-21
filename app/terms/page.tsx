import type { Metadata } from 'next';
import LegalPageShell, { type LegalSection } from '@/components/LegalPageShell';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms governing your use of the Putra Gems (Om Gauri Putra Gems Jewellery & Rudraksh) website, orders, payments, shipping, returns and gold-rate pricing.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Terms & Conditions | Putra Gems',
    description: 'The terms governing your use of the Putra Gems website and orders.',
    url: `${SITE_URL}/terms`,
    type: 'website',
  },
};

const LAST_UPDATED = 'July 29, 2026';

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: (
      <p>
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of omgpgems.com and any
        purchase made from <strong>Om Gauri Putra Gems Jewellery &amp; Rudraksh</strong>, trading as{' '}
        <strong>Putra Gems</strong> (&ldquo;Putra Gems&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
        whether online or at our flagship store. By browsing the Platform, creating an account, or placing an
        order, you agree to be bound by these Terms and our{' '}
        <a href="/privacy-policy">Privacy Policy</a>. If you do not agree, please do not use the Platform.
      </p>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    body: (
      <p>
        You must be at least 18 years old, or transacting under the supervision of a parent or legal guardian, and
        capable of entering into a legally binding contract under the Indian Contract Act, 1872, to place an order
        on the Platform. By placing an order, you confirm that the information you provide is accurate and that you
        meet these eligibility requirements.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'Account Registration',
    body: (
      <>
        <p>
          You may browse the Platform without registering, but an account is required to save addresses, track
          orders and view order history. You are responsible for maintaining the confidentiality of your account
          credentials and for all activity that occurs under your account. Notify us immediately at{' '}
          <a href="mailto:info@omgpgems.com">info@omgpgems.com</a> if you suspect unauthorised use of your account.
        </p>
      </>
    ),
  },
  {
    id: 'products-pricing',
    title: 'Products, Pricing & Gold-Rate Disclaimer',
    body: (
      <>
        <p>
          We make every effort to display product images, descriptions, weight, purity and pricing accurately.
          Minor variations in gemstone colour, size or finish may occur due to the handcrafted, natural nature of
          our products, and screen/display settings may cause slight colour differences from the physical piece.
        </p>
        <p>
          <strong>Gold, silver and gemstone prices fluctuate daily</strong> with market rates. Where a product is
          listed with dynamic, weight-based pricing, its displayed price reflects the gold/silver rate at the time
          you view the page and is <strong>not final</strong> until your order is confirmed at checkout — the price
          charged is the rate in effect at the moment your order is placed and payment is captured. Making charges,
          wastage and applicable taxes (GST) are shown separately at checkout before you complete payment. We
          reserve the right to correct any pricing error, including one caused by a technical fault or an
          out-of-date rate, and will notify you before processing an order affected by such an error, giving you
          the option to confirm at the corrected price or cancel for a full refund.
        </p>
      </>
    ),
  },
  {
    id: 'hallmarking',
    title: 'Hallmarking & Certification',
    body: (
      <p>
        All gold jewellery sold by Putra Gems is BIS hallmarked in accordance with the Bureau of Indian Standards
        (Hallmarking) Regulations, certifying purity (e.g. 22K/916). Silver jewellery is 92.5% (sterling) purity
        unless stated otherwise. Rudraksh beads are sourced and certified for authenticity. Diamonds and precious
        gemstones above the applicable threshold are accompanied by the relevant certification where indicated on
        the product page. A physical invoice detailing purity, weight and making charges accompanies every order.
      </p>
    ),
  },
  {
    id: 'orders',
    title: 'Order Acceptance & Cancellation',
    body: (
      <>
        <p>
          Placing an order is an offer to purchase, which we may accept or decline at our discretion — for
          instance where a product is out of stock, a pricing or listing error is discovered, payment cannot be
          verified, or we suspect fraudulent activity. You will be notified and refunded in full if we are unable
          to fulfil your order.
        </p>
        <p>
          You may request cancellation of an order that has not yet been dispatched by contacting us at{' '}
          <a href="mailto:info@omgpgems.com">info@omgpgems.com</a> or via WhatsApp with your order number.
          Custom-made or personalised pieces, once production has begun, cannot be cancelled.
        </p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    body: (
      <>
        <p>
          We accept payment via credit/debit cards, UPI, net-banking and popular wallets through our payment
          partner, Razorpay, as well as Cash on Delivery where available for your pin code. All online payments are
          verified server-side before an order is confirmed; Putra Gems does not have access to your full card
          details, CVV or UPI PIN.
        </p>
        <p>
          In the rare event a payment is deducted from your account but the order does not confirm, the amount is
          automatically reversed by the bank/payment provider within 5–7 business days. If it is not, contact us
          with your transaction reference and we will help you follow up.
        </p>
      </>
    ),
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    body: (
      <>
        <p>
          Orders are dispatched via our courier partners, typically within 2–4 business days of confirmation for
          in-stock items, and within a longer, product-specific window for made-to-order pieces (shown on the
          product page). Delivery timelines shown at checkout are estimates and may vary due to courier delays,
          weather, regional restrictions, or incomplete/incorrect address details.
        </p>
        <p>
          Free shipping applies on orders above ₹1,999 within India as displayed on the Platform; a shipping fee
          applies below this threshold. High-value shipments are insured and require an OTP or signature on
          delivery for your protection — please ensure someone is available to receive the package.
        </p>
      </>
    ),
  },
  {
    id: 'returns',
    title: 'Returns, Exchange & Refunds',
    body: (
      <>
        <p>
          Most items may be returned or exchanged within <strong>7 days</strong> of delivery, provided the product
          is unused, unworn, undamaged, and returned with its original packaging, invoice, tags and any
          certification provided. To initiate a return or exchange, contact us at{' '}
          <a href="mailto:info@omgpgems.com">info@omgpgems.com</a> or through your order details in{' '}
          <a href="/profile">My Account</a>.
        </p>
        <p>The following categories are <strong>not eligible</strong> for return or exchange, except where the item is defective or materially different from what was ordered:</p>
        <ul>
          <li>Customised, personalised or made-to-order pieces (e.g. engraved or resized items).</li>
          <li>Items showing signs of wear, alteration, or damage not present at delivery.</li>
          <li>Products returned without their original invoice, tags, or certification.</li>
        </ul>
        <p>
          Approved refunds are processed to the original payment method within 7–10 business days of us receiving
          and inspecting the returned item. Refunds for Cash-on-Delivery orders are issued via bank transfer or
          store credit, as you prefer. Return shipping is free where the return is due to our error (wrong/defective
          item); otherwise a reasonable return-shipping charge may apply.
        </p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    body: (
      <p>
        All content on the Platform — including product photography, designs, logos, text, graphics and the
        &ldquo;Putra Gems&rdquo; and &ldquo;Om Gauri Putra Gems Jewellery &amp; Rudraksh&rdquo; names and marks — is
        the property of Putra Gems or its licensors and is protected under Indian copyright and trademark law. You
        may not reproduce, distribute, modify or create derivative works from any part of the Platform without our
        prior written consent.
      </p>
    ),
  },
  {
    id: 'user-conduct',
    title: 'User Conduct',
    body: (
      <>
        <p>When using the Platform, you agree not to:</p>
        <ul>
          <li>Provide false, misleading or fraudulent information when placing an order or creating an account.</li>
          <li>Attempt to gain unauthorised access to any part of the Platform, other users&rsquo; accounts, or our systems.</li>
          <li>Use automated means (bots, scrapers) to access or extract data from the Platform without permission.</li>
          <li>Upload or transmit any content that is unlawful, defamatory, or infringes another party&rsquo;s rights, including in product reviews.</li>
          <li>Interfere with the security or proper functioning of the Platform, including checkout and payment systems.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    body: (
      <p>
        To the maximum extent permitted by applicable law, Putra Gems shall not be liable for any indirect,
        incidental, special or consequential damages arising from your use of the Platform or purchase of our
        products, beyond the value of the order in question. Nothing in these Terms limits any liability that
        cannot be excluded under Indian law, including liability for defective goods under the Consumer Protection
        Act, 2019.
      </p>
    ),
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    body: (
      <p>
        You agree to indemnify and hold Putra Gems, its owners, employees and partners harmless from any claim,
        damage, loss or expense (including reasonable legal fees) arising from your breach of these Terms, misuse
        of the Platform, or violation of any applicable law or third-party right.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law & Jurisdiction',
    body: (
      <p>
        These Terms are governed by the laws of India. Subject to the consumer-forum options described below, any
        dispute arising out of or relating to these Terms or your use of the Platform shall be subject to the
        exclusive jurisdiction of the competent courts at Delhi, India.
      </p>
    ),
  },
  {
    id: 'dispute-resolution',
    title: 'Grievance Redressal & Dispute Resolution',
    body: (
      <>
        <p>
          We aim to resolve every concern amicably and promptly. If you have a complaint about an order, product,
          or any aspect of our service, please contact our Grievance Officer first:
        </p>
        <p>
          <strong>Grievance Officer</strong> — Om Gauri Putra Gems Jewellery &amp; Rudraksh (Putra Gems)
          <br />
          Email: <a href="mailto:info@omgpgems.com">info@omgpgems.com</a> · Phone: +91 88519 11653
          (Monday–Saturday, 10 AM–8 PM IST)
        </p>
        <p>
          We acknowledge complaints within 48 hours and aim to resolve them within 30 days. If a dispute cannot be
          resolved directly, you may approach the appropriate consumer forum under the Consumer Protection Act,
          2019, including the National Consumer Helpline or the e-Daakhil online portal.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    body: (
      <p>
        We may revise these Terms from time to time to reflect changes in our services, business practices, or
        legal requirements. The &ldquo;Last updated&rdquo; date above reflects the most recent revision. Continued
        use of the Platform after a change is posted constitutes your acceptance of the updated Terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: (
      <p>
        For any questions about these Terms, write to us at{' '}
        <a href="mailto:info@omgpgems.com">info@omgpgems.com</a>, call +91 88519 11653, or visit us at Shop No.
        Ground Floor of Prop No. 2, KH No. 56/12/1 and 56/19, Block C-1, Shyam Colony, Budh Vihar Phase-2, Near
        Citizen Public School, Delhi – 110086, India.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Please Read Carefully"
      title="Terms & Conditions"
      lastUpdated={LAST_UPDATED}
      intro="These Terms cover everything from browsing and pricing to payments, shipping and returns. By shopping with Putra Gems, online or in-store, you agree to them."
      sections={sections}
    />
  );
}
