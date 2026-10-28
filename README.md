# Crave Nation — Interactive AR Menu (Prototype)

Mobile-first WebAR restaurant menu for **Crave Nation**. Point your phone at the printed
Crave Nation menu, tap a dish straight on the physical menu through the live camera, and the
dish comes to life in AR with floating boards (sample reviews, estimated calories, sample
ingredients, demo rating) and a cheering mascot.

> **Prototype status:** everything here is demo content. Reviews, reviewer names, avatars,
> ratings, ingredient lists and calorie numbers are clearly-labelled **sample estimates**, not
> verified restaurant data. Menu item names and prices are transcribed from the supplied
> printed menu and used as sample data. Camera tracking and physical-device behaviour are
> documented under *Built & verified* / *Not yet verified* below.

---

## 1. Supplied images used

| File in project | Source image (as supplied) | Role |
| --- | --- | --- |
| `public/images/menu.jpg` | Crave Nation printed menu | **Primary image-tracking target** and source of all item names/prices and AR dish crops |
| `public/images/cafe-night.jpg` | Cafe exterior photo (purple neon sign, night) | Welcome screen hero + demo-mode backdrop |
| `public/images/cafe-day.jpg` | Additional cafe photo (daylight) | Supporting brand imagery |
| `public/images/nuggets-fries-dips.jpg` | Chicken nuggets + fries + dips photo | **Featured dish visual** (Chicken Nuggets 2.5D cutout) |
| — | Food catalog image (dark grid render) | Not found as a file in the project folder; dish crops use the printed menu instead. Drag a catalog export into `public/images/` and point dish `crop.image` entries at it if you want its crops |

The five brand images were supplied alongside the task; four of them exist as files on this
machine (`Unknown.jpeg`, `Unknown-1/2/3.jpeg` on the Desktop) and were copied into
`public/images/` with descriptive names. If your copies live elsewhere, just re-copy them over
the same paths.

## 2. How it works (architecture)

```
src/
  App.tsx                      flow: welcome ⇄ AR ⇄ demo mode
  screens/WelcomeScreen.tsx    SCREEN 1 — cafe photo, brand, "Explore AR Menu"
  screens/ArScreen.tsx         SCREEN 2+3 — camera feed, tracking indicator,
                               tap→dish mapping, calibration overlay, dish list fallback
  screens/DemoModeView.tsx     non-AR fallback (no camera / missing tracking target)
  components/
    DishExperienceSheet.tsx    name+price bar, boards container, mascot
    Boards.tsx                 review bubble, calorie card, ingredients, stars
    Mascot.tsx                 cheering fry-box mascot (SVG + CSS keyframes)
  ar/
    arSession.ts               MindARthree lifecycle, ghost preview, flip calibration,
                               tap→menuUV raycasting, menuUV→screen projection
    coords.ts                  pure coordinate conversions (unit-tested)
    content.ts                 three.js dish visuals: featured 2.5D nuggets cutout,
                               placeholder photo cards, fake soft shadow, float/bob,
                               entrance/exit animations, drag-to-turn
  data/menu.ts                 all 7 demo dishes + tap regions + prices + sample boards data
public/targets/menu.mind       compiled MindAR tracking target (generated)
scripts/compile-targets.mjs    regenerates public/targets/menu.mind from menu.jpg
tests/coords.test.ts           vitest unit tests for coordinate math
```

- **Tracking:** MindAR image tracking (`mind-ar@1.2.5`, `mindar-image-three.prod.js`), rear
  camera, one anchor group for the whole menu.
- **Rendering:** MindAR manages the camera + pose; we own the render loop and add a
  three.js group per dish. Food content is a **2.5D cutout plane** (rounded-corner alpha of the
  supplied photograph) — explicitly not a claimed-real 3D model. Soft radial-gradient shadow,
  slow sway + gentle bob, drag-to-turn, pop-in/pop-out animations. Swap in GLB/GLTF models any
  time by extending the `show()` builder in `src/ar/content.ts`.
- **Tap mapping:** a pointer tap is raycast onto the virtual menu plane anchored to the
  physical menu, producing **menu-image UV coordinates** (0..1 across/down the printed menu —
  never phone-screen coordinates). Those match the tap regions in `src/data/menu.ts`, which
  were configured from the supplied menu image. `?calibrate=1` draws every region's projected
  centre over the live feed so regions can be verified/fine-tuned on a real printed menu.
- **Boards:** CSS animated cards anchored near the projected dish position (clamped to the
  viewport, portrait/landscape responsive).

## 3. Run locally

```bash
npm install

# local dev (plain http; camera AR needs the flag below or a phone)
npm run dev               # → http://localhost:5173

# IMPORTANT: camera permission is granted on the CLI/local
# "localhost" only. For another machine on your LAN use:
npm run dev -- --host

# production build + preview (HTTPS still required for phones)
npm run build
npm run preview

# unit tests (coordinate math)
npm test

# regenerate the MindAR tracking target from menu.jpg
npm run compile-targets   # writes public/targets/menu.mind
```

### Camera requirements

- The camera API (`getUserMedia`) only works on **secure contexts**: `https://…` or `localhost`.
- `localhost` on the same machine is allowed http; anything else (phone → laptop IP, LAN QR)
  needs **HTTPS**, e.g. run `npm run dev -- --host --https` or deploy to Vercel.
- Safari (iPhone, iOS 16.4+) and Chrome (Android) are the primary targets.

### Try it on a phone without deploying

```bash
npm run dev -- --host  --port 5173
# prints e.g. http://192.168.x.x:5173 — open it on the phone (same Wi-Fi) over HTTP, or:
npx serve dist            # after npm run build
npx localtunnel --port 5173   # or any https tunnel to get an HTTPS URL
```

**QR generation** for the deployed URL is just a QR of the site URL, e.g.:

```bash
npx qrcode-terminal "https://crave-nation-ar.vercel.app/"
# or a printable QR file:
npx qrcode -o crave-qr.png "https://crave-nation-ar.vercel.app/"
```

## 4. Deploy to Vercel

```bash
npm i -g vercel      # one-time
vercel               # project settings are auto-detected (Vite)
vercel --prod
```

`vercel.json` included: SPA rewrite + cache headers for images and the `.mind` target.
Vercel serves over HTTPS, which satisfies the camera secure-context requirement.

## 5. Tracking-target setup & replacing assets

- **Recompile the target** after changing `public/images/menu.jpg`:
  `npm run compile-targets`. The script shim-replaces the `canvas` native dep with
  prebuilt `@napi-rs/canvas` (works around node-gyp failures on Node 22+).
  Keep the menu image **flat-on, well-lit, high-contrast**; the more texture (photos/numbers),
  the better MindAR tracks. Our menu has plenty of texture — good target.
- **Printed-menu sizes:** tracking is scale-invariant; AR content is sized relative to the
  tracked menu, so any print size works.
- **Dish photos/models:** edit `crop` entries in `src/data/menu.ts` (either crops of the menu
  or the nuggets photo), or extend `DishExperience.show()` in `src/ar/content.ts` to load real
  GLB/GLTF models instead of the 2.5D cutouts.
- **Copy/text changes:** reviews, ingredients, calories, mascot lines are all in
  `src/data/menu.ts` — one file, clearly commented.

## 6. One-time calibration (important)

Because MindAR's anchor convention can render the preview plane flipped depending on
device/browser, the AR screen has an in-app **Calibrate** mode (`⚙ Calibrate` button, or
append `?calibrate=1`):

1. It shows a translucent ghost of the menu photo pinned to the tracked menu.
2. Compare with the physical printed menu. If the preview is upside down, tap **🔄 Flip
   preview**. The choice flips *both* the ghost preview **and** the tap mapping together, so
   they always stay consistent, and persists in `localStorage`.
3. Region dots labelled with each dish name appear over the tracked menu — verify each dot
   sits on the right dish photo. Regions live in `src/data/menu.ts` and are plain menu-image
   UV rectangles (`region: {x, y, w, h}`), so nudging them is trivial.

## 7. Built & verified on this machine

- `npm run build` — production build passes (TypeScript + Vite, MindAR chunk split out).
- `npm test` — 9/9 unit tests pass (menuUV↔local round-trip, region picking, ray→menuUV).
- `npm run dev` — dev server boots and serves the app.
- Target compilation ran from the supplied `menu.jpg` → `public/targets/menu.mind` (~804 kB).

## 8. Not yet verified (needs a physical phone)

- **Live rear-camera tracking quality** on iOS/Android (frame rate, reacquisition after
  tracking loss, landscape/portrait behaviour).
- **Exact tap-region alignment** against a fresh print of the menu — the regions were
  configured from the supplied menu image; use `?calibrate=1` on a real device to fine-tune.
- **Which flip state is the default truth** for a given device (that's exactly what the
  calibrate toggle resolves; it is pre-checked, one tap, persisted).
- Camera-permission denial flow end-to-end on iOS (implemented and unit-logic reviewed, but
  requires a real device/HTTPS origin to exercise).

## 9. Safety rails built into the product

- Every floating board carries a visible **“sample” / “estimate” / “demo”** tag and a short
  disclaimer line; mascot reviews are labelled “Fictional prototype review”.
- No restaurant contact details, no ordering/connection claims are made anywhere in the UI.
- Demo mode (camera-less) is reachable when camera access is denied, when the browser is
  unsupported, or when `menu.mind` is missing — always with a visible demo indicator.
