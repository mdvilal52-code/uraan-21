// Shared types + client-side validation for saved delivery addresses.
export type AddressType = 'Home' | 'Work' | 'Other';

export type Address = {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  houseNo: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddressInput = {
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  houseNo: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: AddressType;
  isDefault: boolean;
};

const PINCODE_RE = /^[0-9]{6}$/;

/** Client-side validation mirrored server-side in the API routes. */
export function validateAddress(input: AddressInput): string | null {
  if (!input.fullName.trim()) return 'Full name is required.';
  if (!input.mobile.trim()) return 'Mobile number is required.';
  if (!input.houseNo.trim()) return 'House / Flat No is required.';
  if (!input.street.trim()) return 'Street / Area is required.';
  if (!input.city.trim()) return 'City is required.';
  if (!input.state.trim()) return 'State is required.';
  if (!input.pincode.trim()) return 'Pincode is required.';
  if (!PINCODE_RE.test(input.pincode.trim())) return 'Pincode must be exactly 6 digits.';
  if (!input.country.trim()) return 'Country is required.';
  return null;
}
