# UI Layout & Components

## Header
- Keep the service name `이유식` centered inside the sticky top header.
- Maintain generous vertical padding so the title remains prominent on mobile (`py-4` recommended).

## Buttons
- Default pill shape using `rounded-full` with brand palette fills (`brand`, `brand-light`, `critical`).
- Ensure tap targets are at least `44px` tall; pair with `px-5` for comfortable hit areas.
- Hover and focus states rely on opacity shifts or `bg-brand/10` to reinforce the color system.

## Choice Cards
- Wrap selectable options in soft containers (`rounded-xl` or larger) with subtle borders and shadows for separation.
- Apply `outline-brand` on focus-visible to support keyboard navigation.

## Card Component
- Use `<Card tone="soft" | "lifted">` to apply the white background, brand-light border, and appropriate shadow.
- Default tone (`default`) suits primary surfaces; `lifted` creates extra elevation for featured blocks.

## Spacing
- Add `gap-3` or larger between grouped choices so each pill reads as an independent action.
- Leave room beneath the global header by padding the main container (`pt-6`+) before page content.
