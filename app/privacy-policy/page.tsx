import type { Metadata } from 'next';
import LegalPageShell, { type LegalSection } from '@/components/LegalPageShell';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Putra Gems (Om Gauri Putra Gems Jewellery & Rudraksh) collects, uses, stores and protects your personal information when you shop with us online or in-store.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Privacy Policy | Putra Gems',
    description:
      'How Putra Gems collects, uses, stores and protects your personal information.',
    url: `${SITE_URL}/privacy-policy`,
    type: 'website',
  },
};

const LAST_UPDATED = 'July 29, 2026';

const sections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: (
      <>
        <p>
          This Privacy Policy explains how <strong>Om Gauri Putra Gems Jewellery &amp; Rudraksh</strong> — trading
          as <strong>Putra Gems</strong> (&ldquo;Putra Gems&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or
          &ldquo;our&rdquo;) — collects, uses, discloses and protects the personal information of visitors to
          omgpgems.com and customers of our flagship store in Delhi (together, the &ldquo;Platform&rdquo;).
        </p>
        <p>
          By browsing the Platform, creating an account, placing an order, or contacting us, you agree to the
          collection and use of your information as described in this Policy. This Policy is published in
          accordance with the Information Technology Act, 2000 and the Information Technology (Reasonable
          Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
        </p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    body: (
      <>
        <p>We collect the following categories of information:</p>
        <ul>
          <li>
            <strong>Identity &amp; contact details</strong> — name, email address, phone number, delivery and
            billing address, provided when you register, check out as a guest, or contact our support team.
          </li>
          <li>
            <strong>Order information</strong> — the products you purchase, quantities, prices, coupon codes used,
            order status and delivery preferences.
          </li>
          <li>
            <strong>Payment information</strong> — when you pay online, your card, UPI or net-banking details are
            collected and processed directly by our payment gateway partner, Razorpay. Putra Gems does{' '}
            <strong>not</strong> receive or store your full card number, CVV or UPI PIN on our servers.
          </li>
          <li>
            <strong>Communications</strong> — messages you send us via the contact form, email, phone or WhatsApp,
            including any enquiry, feedback or complaint you share with us.
          </li>
          <li>
            <strong>Account credentials</strong> — if you register an account, your password is salted and hashed
            before storage; we never store it, or transmit it to anyone, in plain text.
          </li>
          <li>
            <strong>Device &amp; usage data</strong> — IP address, browser type, device identifiers, pages viewed,
            referring URLs, and approximate location (derived from IP), collected automatically when you use the
            Platform.
          </li>
          <li>
            <strong>Location data</strong> — if you use the store-locator/map feature or share your location during
            checkout to speed up address entry, we use it only to pre-fill your delivery address.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Process, confirm, pack, ship and deliver your orders, and to handle returns, exchanges and refunds.</li>
          <li>Verify payments and prevent fraudulent or unauthorised transactions.</li>
          <li>
            Send transactional updates — order confirmations, shipping updates, delivery alerts and payment
            receipts — via email, SMS and WhatsApp.
          </li>
          <li>Respond to your enquiries, complaints and customer-service requests.</li>
          <li>
            Send promotional offers, new-collection announcements and festive discounts, where you have opted in —
            you can unsubscribe from marketing messages at any time (see &ldquo;Your Rights and Choices&rdquo;
            below).
          </li>
          <li>Maintain your account, order history, saved addresses and wishlist.</li>
          <li>Improve our Platform, catalogue, and in-store experience through aggregated, anonymised analytics.</li>
          <li>Comply with our legal obligations, including tax, accounting and consumer-protection recordkeeping.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking Technologies',
    body: (
      <>
        <p>
          The Platform uses cookies and similar technologies (such as browser local storage) to keep you signed in,
          remember items in your cart and wishlist, and understand how visitors use our site. These fall into three
          categories:
        </p>
        <ul>
          <li>
            <strong>Essential cookies</strong> — required for core functions like checkout and admin sessions; the
            Platform cannot function correctly without these.
          </li>
          <li>
            <strong>Preference storage</strong> — remembers your cart, wishlist and recently viewed items between
            visits, stored in your browser rather than on our servers.
          </li>
          <li>
            <strong>Analytics cookies</strong> — where enabled, Google Analytics helps us understand aggregate
            traffic patterns; this data is anonymised and is never combined with your order or payment details.
          </li>
        </ul>
        <p>
          You can disable cookies in your browser settings at any time; doing so may affect features such as the
          cart, wishlist and saved sign-in.
        </p>
      </>
    ),
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Service Providers',
    body: (
      <>
        <p>
          We share the minimum information necessary with trusted service providers who help us run the Platform,
          each bound by their own privacy and security obligations:
        </p>
        <ul>
          <li><strong>Razorpay</strong> — payment processing (cards, UPI, net-banking, wallets).</li>
          <li><strong>Shiprocket</strong> and its partner couriers — order packing, dispatch and delivery tracking.</li>
          <li>
            <strong>Meta / WhatsApp Business Platform</strong> — order updates and customer support conversations
            you initiate over WhatsApp.
          </li>
          <li><strong>Supabase</strong> — secure hosting of our order, account and support database.</li>
          <li><strong>Google Analytics</strong> — aggregated, anonymised website-traffic analytics, where enabled.</li>
          <li><strong>Resend</strong> — transactional and account-security emails (order receipts, OTPs, alerts).</li>
        </ul>
        <p>
          We do not sell, rent or trade your personal information to any third party for their own marketing
          purposes.
        </p>
      </>
    ),
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing & Disclosure',
    body: (
      <>
        <p>Beyond the service providers listed above, we disclose personal information only where:</p>
        <ul>
          <li>You have given explicit consent for a specific purpose.</li>
          <li>
            Disclosure is required to comply with a court order, statutory notice, or a lawful request from a
            government or regulatory authority.
          </li>
          <li>It is necessary to investigate or prevent fraud, security incidents, or violations of our Terms.</li>
          <li>
            It is part of a business transfer (e.g. merger or acquisition), in which case the receiving entity
            remains bound by this Policy for the data it acquires.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    body: (
      <>
        <p>We apply industry-standard safeguards to protect your information, including:</p>
        <ul>
          <li>Encryption in transit via HTTPS/TLS across the entire Platform, and at rest for our database.</li>
          <li>Passwords stored using salted, industry-standard hashing — never in plain text.</li>
          <li>Role-based access control so only authorised staff can view order and customer data.</li>
          <li>Rate-limiting and monitoring on login and checkout endpoints to deter automated abuse.</li>
          <li>A full audit trail of administrative actions taken on customer and order records.</li>
        </ul>
        <p>
          No method of transmission or storage is 100% secure. While we work hard to protect your information, we
          cannot guarantee absolute security, and you share information with us at your own risk.
        </p>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    body: (
      <>
        <p>
          We retain personal information for as long as your account is active or as needed to provide you
          service. Order, invoice and payment records are retained for the period required under applicable Indian
          tax, accounting and consumer-protection law (currently up to eight years for financial records), even
          after account deletion. Marketing communication preferences and browsing data are retained only as long
          as reasonably necessary for the purposes described in this Policy, or until you withdraw consent.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights & Choices',
    body: (
      <>
        <p>You may, at any time:</p>
        <ul>
          <li>Access, review and update your profile and saved addresses from <strong>My Account</strong>.</li>
          <li>Opt out of promotional emails, SMS and WhatsApp messages by using the unsubscribe link, replying STOP, or emailing us.</li>
          <li>Request a copy of the personal information we hold about you.</li>
          <li>
            Request correction of inaccurate information, or deletion of your account and associated data — see our{' '}
            <a href="/data-deletion">Data Deletion</a> page for the full process.
          </li>
        </ul>
        <p>To exercise any of these rights, write to us at the contact details below; we respond to all verified requests within 30 days.</p>
      </>
    ),
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    body: (
      <p>
        The Platform is intended for users who are 18 years of age or older, or who are transacting under the
        supervision of a parent or legal guardian. We do not knowingly collect personal information from children
        under 18. If you believe a child has provided us with personal information, please contact us so we can
        remove it.
      </p>
    ),
  },
  {
    id: 'grievance-officer',
    title: 'Grievance Officer',
    body: (
      <>
        <p>
          In accordance with the Information Technology Act, 2000 and the rules made thereunder, and the Consumer
          Protection (E-Commerce) Rules, 2020, the details of the Grievance Officer are provided below. If you have
          any concerns, questions or complaints regarding this Policy or the handling of your personal information,
          please reach out:
        </p>
        <p>
          <strong>Grievance Officer</strong>
          <br />
          Om Gauri Putra Gems Jewellery &amp; Rudraksh (Putra Gems)
          <br />
          Shop No. Ground Floor of Prop No. 2, KH No. 56/12/1 and 56/19, Block C-1, Shyam Colony, Budh Vihar
          Phase-2, Near Citizen Public School, Delhi – 110086, India
          <br />
          Email: <a href="mailto:info@omgpgems.com">info@omgpgems.com</a>
          <br />
          Phone: +91 88519 11653 (Monday–Saturday, 10 AM–8 PM IST)
        </p>
        <p>We acknowledge grievances within 48 hours and aim to resolve them within 30 days of receipt.</p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal
        requirements, or for other operational reasons. The &ldquo;Last updated&rdquo; date at the top of this page
        indicates when it was last revised. We encourage you to review this page periodically; continued use of the
        Platform after changes are posted constitutes acceptance of the revised Policy.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: (
      <p>
        For any questions about this Privacy Policy or how we handle your data, contact us at{' '}
        <a href="mailto:info@omgpgems.com">info@omgpgems.com</a>, call +91 88519 11653, or write to us at Shop No.
        Ground Floor of Prop No. 2, KH No. 56/12/1 and 56/19, Block C-1, Shyam Colony, Budh Vihar Phase-2, Near
        Citizen Public School, Delhi – 110086, India.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Your Trust, Protected"
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro="We know jewellery is personal — so is your data. This page explains, in plain language, exactly what information Putra Gems collects, why we collect it, and the choices you have."
      sections={sections}
    />
  );
}
