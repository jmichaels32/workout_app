"""Generate the app's pre-rendered thermal art assets (see DESIGN.md §5).

The house art is raster, not CSS: spectral noise -> domain warp -> thermal
LUT -> isotherm contours -> film grain. Regenerate with:

    python3 scripts/generate_art.py   (needs numpy + pillow)

Deterministic: fixed seeds, so re-running reproduces the shipped assets.
"""

from pathlib import Path

import numpy as np
from PIL import Image

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "art"

# DESIGN.md heat ramp, anchored below by the page ground so the image sits in it
HEAT_STOPS = [
    (0.00, (0x13, 0x11, 0x18)),   # --bg carbon
    (0.30, (0x1d, 0x1f, 0x52)),   # deep indigo
    (0.46, (0x39, 0x46, 0xd8)),   # --heat-0
    (0.58, (0x7d, 0x3b, 0xee)),   # --heat-25
    (0.70, (0xe0, 0x36, 0x9e)),   # --heat-50
    (0.84, (0xff, 0x4d, 0x1f)),   # --heat-75
    (0.95, (0xff, 0xa6, 0x2b)),   # --heat-100
    (1.00, (0xff, 0xd9, 0x8f)),   # blown-out core
]


def spectral_noise(shape, beta, rng):
    """Smooth cloud field via 1/f^beta spectral synthesis."""
    white = rng.standard_normal(shape)
    spectrum = np.fft.fft2(white)
    fy = np.fft.fftfreq(shape[0])[:, None]
    fx = np.fft.fftfreq(shape[1])[None, :]
    freq = np.sqrt(fx**2 + fy**2)
    freq[0, 0] = 1.0
    field = np.real(np.fft.ifft2(spectrum / freq**beta))
    field -= field.min()
    return field / np.ptp(field)


def bilinear_sample(field, x, y):
    h, w = field.shape
    x = np.clip(x, 0, w - 1.001)
    y = np.clip(y, 0, h - 1.001)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    tx, ty = x - x0, y - y0
    top = field[y0, x0] * (1 - tx) + field[y0, x0 + 1] * tx
    bottom = field[y0 + 1, x0] * (1 - tx) + field[y0 + 1, x0 + 1] * tx
    return top * (1 - ty) + bottom * ty


def heat_lut(t):
    rgb = np.zeros(t.shape + (3,))
    for (p0, c0), (p1, c1) in zip(HEAT_STOPS, HEAT_STOPS[1:]):
        mask = (t >= p0) & (t <= p1)
        local = (t[mask] - p0) / (p1 - p0)
        for ch in range(3):
            rgb[..., ch][mask] = c0[ch] + (c1[ch] - c0[ch]) * local
    return rgb


def render_thermal(width, height, seed, hot_at=(0.78, 0.16), warp_px=260,
                   contour_count=26.0, contour_strength=0.24):
    rng = np.random.default_rng(seed)
    shape = (height, width)

    base = spectral_noise(shape, beta=3.4, rng=rng)
    warp_x = spectral_noise(shape, beta=3.0, rng=rng) - 0.5
    warp_y = spectral_noise(shape, beta=3.0, rng=rng) - 0.5

    yy, xx = np.mgrid[0:height, 0:width].astype(float)
    field = bilinear_sample(base, xx + warp_x * warp_px, yy + warp_y * warp_px)

    # Heat source: falloff from the hot spot so composition survives cover-crops
    cx, cy = hot_at[0] * width, hot_at[1] * height
    dist = np.sqrt(((xx - cx) / width) ** 2 + ((yy - cy) / height) ** 2)
    source = np.clip(1.0 - dist * 1.55, 0, 1) ** 1.6

    t = np.clip(0.46 * field + 0.64 * source, 0, 1) ** 1.5

    # Isotherm contour lines: darken thin bands of constant temperature
    phase = (t * contour_count) % 1.0
    lines = np.clip(1.0 - np.abs(phase - 0.5) * 14.0, 0, 1)
    shade = 1.0 - lines * contour_strength * np.clip(t * 1.6, 0.25, 1.0)

    rgb = heat_lut(t) * shade[..., None]

    # Film grain, stronger in the dark regions like pushed film
    grain = rng.standard_normal(shape + (1,)) * (6.5 + 6.0 * (1 - t[..., None]))
    return np.clip(rgb + grain, 0, 255).astype(np.uint8)


def save(img_array, name, quality=82):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    Image.fromarray(img_array).save(path, quality=quality, method=6)
    print(f"wrote {path} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    save(render_thermal(1600, 900, seed=11), "thermal-hero.webp")
