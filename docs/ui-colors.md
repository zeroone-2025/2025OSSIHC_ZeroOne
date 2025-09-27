# UI Color Palette

## Brand Colors
- Primary (`brand` / `#DD0303`): call-to-actions, header title, destructive emphasis.
- Secondary (`brand-sub1` / `#FA812F`): supportive actions, positive chips, outline accents.
- Tertiary (`brand-sub2` / `#FAB12F`): soft highlights, tertiary buttons, notification pills.
- Background (`brand-bg` / `#FEF3E2`): app canvas, section separators, neutral backdrop for cards.

## Usage Guidance
- Cards and modals stay on `bg-white` above `bg-brand-bg` sections to preserve depth.
- Information badges default to `bg-brand-sub1/20` with `text-brand-sub1`; reserve full `bg-brand` only for urgent messaging.
- Primary buttons combine `bg-brand` with white text; secondary buttons use `bg-brand-sub1` and tertiary buttons use `bg-brand-sub2` with dark text.
- Focus rings and interactive outlines rely on `brand-sub1` to keep keyboard navigation visible against the warm background.
- Check color contrast (≥ 4.5:1) when pairing text with `brand-sub2`; prefer white text on `brand` and `brand-sub1` surfaces.
