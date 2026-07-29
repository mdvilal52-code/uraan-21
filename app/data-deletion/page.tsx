import type { Metadata } from 'next';
import LegalPageShell, { type LegalSection } from '@/components/LegalPageShell';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Data Deletion',
  description:
    'How to request deletion of your personal account and data from Putra Gems (Om Gauri Putra Gems Jewellery & Rudraksh) — what gets deleted, what we must retain, and how long it takes.',
  alternates: { canonical: `${SITE_URL}/data-deletion` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Data Deletion | Putra Gems',
    description: 'How to request deletion of your personal account and data from Putra Gems.',
    url: `${SITE_URL}/data-deletion`,
    type: 'website',
  },
};

const LAST_UPDATED = 'July 29, 2026';

const sections: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <p>
        You have the right to request deletion of the personal account and data <strong>Putra Gems</strong>{' '}
        (Om Gauri Putra Gems Jewellery &amp; Rudraksh) holds about you. This page explains exactly what can be
        deleted, what we are required by law to keep, how to submit a request, and how long the process takes.
      </p>
    ),
  },
  {
    id: 'what-can-be-deleted',
    title: 'What Can Be Deleted',
    body: (
      <>
        <p>On request, we will permanently delete:</p>
        <ul>
          <li>Your account profile — name, email, phone number, and password.</li>
          <li>Saved delivery addresses and payment preferences stored on your account.</li>
          <li>Your wishlist and browsing/preference history linked to your account.</li>
          <li>Marketing consent and communication preferences.</li>
          <li>Support conversations and enquiries you&rsquo;ve sent us, once resolved.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'what-we-retain',
    title: 'What We May Retain',
    body: (
      <>
        <p>
          Indian tax, accounting and consumer-protection law require certain records to be retained even after you
          request deletion. We will continue to hold, in a restricted, access-limited form, only what the law
          requires:
        </p>
        <ul>
          <li>
            <strong>Order and invoice records</strong> — retained for the statutory period (currently up to eight
            years) under the Income Tax Act and GST law, for accounting and audit purposes.
          </li>
          <li>
            <strong>Transaction records</strong> held by our payment partner, Razorpay, and courier partner,
            Shiprocket, which are governed by their own retention obligations and privacy policies.
          </li>
          <li>
            <strong>Records relevant to an open dispute, return, warranty claim, or legal proceeding</strong>,
            until that matter is resolved.
          </li>
          <li>
            <strong>Fraud-prevention records</strong>, where retention is necessary to protect Putra Gems or other
            customers from fraudulent activity.
          </li>
        </ul>
        <p>
          This retained data is used solely for the legal purpose it was kept for, is not used for marketing, and
          is deleted once the applicable retention period expires.
        </p>
      </>
    ),
  },
  {
    id: 'how-to-request',
    title: 'How to Request Deletion',
    body: (
      <>
        <p>To request deletion of your account and data, choose either option:</p>
        <ol>
          <li>
            <strong>Email us</strong> at{' '}
            <a href="mailto:info@omgpgems.com?subject=Data%20Deletion%20Request">info@omgpgems.com</a> with the
            subject line <strong>&ldquo;Data Deletion Request&rdquo;</strong>, from the email address registered on
            your account, including your registered phone number so we can verify your identity.
          </li>
          <li>
            <strong>Message us on WhatsApp</strong> at +91 88519 11653 with your registered name, email, and a
            request to delete your account.
          </li>
        </ol>
        <p>
          For your security, we may ask you to verify your identity (for example, via an OTP to your registered
          phone number or email) before processing a deletion request, so that no one else can delete your account
          on your behalf.
        </p>
      </>
    ),
  },
  {
    id: 'processing-timeline',
    title: 'Processing Timeline',
    body: (
      <p>
        We acknowledge every deletion request within <strong>48 hours</strong> and complete deletion of all
        eligible data within <strong>30 days</strong> of verifying your identity. You will receive a confirmation
        email once the process is complete. If any data must be retained per the &ldquo;What We May Retain&rdquo;
        section above, we will tell you what is being kept and why.
      </p>
    ),
  },
  {
    id: 'after-deletion',
    title: 'What Happens After Deletion',
    body: (
      <>
        <p>Once your account is deleted:</p>
        <ul>
          <li>You will no longer be able to sign in, and your order history will no longer be viewable through the Platform.</li>
          <li>Any pending or active order should be allowed to complete first — deleting your account does not cancel an order already placed; contact us separately to cancel an active order.</li>
          <li>Saved wishlist items, addresses and marketing preferences are permanently removed.</li>
          <li>You&rsquo;re welcome to create a new account at any time in the future.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party-data',
    title: 'Data Held by Third Parties',
    body: (
      <p>
        Some data related to your orders is held directly by our service providers under their own privacy
        policies — for example, payment records with Razorpay, or WhatsApp conversation logs with Meta. Deleting
        your Putra Gems account does not automatically delete data these providers independently hold; you may
        need to contact them directly for a full deletion of records on their platforms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact for Data Deletion Requests',
    body: (
      <p>
        Send your request to{' '}
        <a href="mailto:info@omgpgems.com?subject=Data%20Deletion%20Request">info@omgpgems.com</a>, message us on
        WhatsApp at +91 88519 11653, or write to us at Shop No. Ground Floor of Prop No. 2, KH No. 56/12/1 and
        56/19, Block C-1, Shyam Colony, Budh Vihar Phase-2, Near Citizen Public School, Delhi – 110086, India.
      </p>
    ),
  },
];

export default function DataDeletionPage() {
  return (
    <LegalPageShell
      eyebrow="Your Data, Your Choice"
      title="Data Deletion"
      lastUpdated={LAST_UPDATED}
      intro="Want your account and personal data removed from Putra Gems? Here's exactly what gets deleted, what we're legally required to keep, and how to start the process."
      sections={sections}
    />
  );
}
