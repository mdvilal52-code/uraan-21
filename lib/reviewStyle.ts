// Each reviewer gets her own accent colour and an initials avatar so the
// review cards read colourfully without sharing one stock photo.
export const reviewAccents = [
  '#8e1f2f', // maroon
  '#b08430', // gold
  '#3d6b5a', // emerald
  '#5b4a8a', // royal purple
  '#a85420', // terracotta
  '#1f5f8b', // sapphire
  '#b03060', // rose
  '#6b4226', // coffee
  '#2e6b5e', // teal
];

export function reviewAccent(index: number): string {
  return reviewAccents[index % reviewAccents.length];
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
