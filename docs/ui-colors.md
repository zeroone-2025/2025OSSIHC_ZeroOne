# UI Color Palette

## Brand Colors
- Primary (`brand` / `#FA812F`): main call-to-action buttons, key highlights, active state accents.
- Secondary (`brand-light` / `#FAB12F`): secondary actions, map shortcuts, subtle pills. Pair with dark text for contrast.
- Background (`brand-pale` / `#FEF3E2`): page background, section dividers, neutral surfaces surrounding white cards.
- Critical (`critical` / `#DD0303`): destructive actions and error messaging only. Avoid for general emphasis.

## Usage Guidance
- Cards and modals stay on `bg-white` above `bg-brand-pale` sections to preserve depth.
- Information badges default to `bg-brand/10` with `text-brand`; warnings can reuse the same treatment. Reserve `critical` tints for blocking states.
- Primary buttons combine `bg-brand` with white text; secondary buttons use `bg-brand-light` with dark text (`text-stone-900`) plus hover opacity.
- Focus rings and interactive outlines use `outline-brand` to keep keyboard navigation visible against pale surfaces.
- Check color contrast (≥ 4.5:1) when pairing text with `brand-light`; prefer dark text on light fills and white text on `brand` surfaces.
