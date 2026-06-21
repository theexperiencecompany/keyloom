# Images

> Delivering artwork at the right format and resolution so it looks sharp on every display.

**When to use it:** Whenever you present photos, illustrations, or other imagery across varied screen densities.

**Guidelines**
- Provide high-resolution artwork for high-density displays rather than a single fixed-size image.
- Match format to content: scalable vector art for flat icons and illustrations, compressed formats for photos, transparency where needed.
- Align artwork to a clean pixel grid so it stays crisp when scaled up.
- Use consistent, color-managed assets so imagery renders the same everywhere.
- Optimize file sizes and defer loading of offscreen imagery so the experience stays responsive.
- Test on real devices and a range of sizes — previews can hide pixelation or stretching.

**Accessibility**
- Provide a meaningful text description for informative images, and treat purely decorative images as hidden.
- Don't bake essential information only into an image without a text equivalent.
- Prefer real text over text rendered inside an image, and keep any in-image text high-contrast.

**Avoid**
- Shipping a single low-resolution image that blurs on high-density screens.
- Using flat raster artwork for graphics that must scale.
- Oversized, unoptimized image files.

**Full reference:** [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/images)
