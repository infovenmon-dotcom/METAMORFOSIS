#!/usr/bin/env python3
"""Genera las imagenes provisionales (SVG) de la web de IGR.

No son fotos: son composiciones geometricas con la paleta de la marca para que
la web se vea terminada mientras no haya reportaje fotografico. Sustituye cada
archivo por la foto real (mismo nombre, .jpg/.webp) y actualiza el `src`.

    python3 scripts/igr_placeholders.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "igr" / "assets" / "img"

BRAND, HELMET, INK = "#FF6B1A", "#FFC02E", "#0E1116"


def frame(w, h, body, bg_a, bg_b, label, tone="dark"):
    fg = "#FFFFFF" if tone == "dark" else "#12161C"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{bg_a}"/><stop offset="1" stop-color="{bg_b}"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="{fg}" stroke-opacity=".08" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#bg)"/>
  <rect width="{w}" height="{h}" fill="url(#grid)"/>
{body}
  <g font-family="Barlow Condensed, Arial Narrow, sans-serif" fill="{fg}" fill-opacity=".62">
    <text x="34" y="{h - 30}" font-size="26" letter-spacing="3">{label}</text>
  </g>
</svg>
'''


def write(name, svg):
    (OUT / name).write_text(svg, encoding="utf-8")
    print("  ->", name)


def hero():
    b = f'''  <g opacity=".9">
    <path d="M0 620 L360 470 L720 560 L1080 400 L1440 500 L1600 440 V900 H0 Z" fill="#0B0E13" opacity=".85"/>
    <rect x="120" y="250" width="230" height="420" fill="#12171F"/>
    <rect x="400" y="170" width="270" height="500" fill="#161C25"/>
    <rect x="720" y="300" width="200" height="370" fill="#12171F"/>
    <rect x="980" y="120" width="300" height="550" fill="#161C25"/>
    <g fill="{HELMET}" opacity=".22">
      <rect x="150" y="290" width="60" height="70"/><rect x="240" y="290" width="60" height="70"/>
      <rect x="430" y="220" width="70" height="80"/><rect x="540" y="220" width="70" height="80"/>
      <rect x="1010" y="180" width="80" height="90"/><rect x="1140" y="180" width="80" height="90"/>
      <rect x="1010" y="330" width="80" height="90"/><rect x="1140" y="330" width="80" height="90"/>
    </g>
    <g stroke="{BRAND}" stroke-width="7" fill="none" opacity=".9">
      <path d="M1290 690 V180 h170"/><path d="M1290 300 h120"/>
    </g>
    <path d="M1455 175 l60 26 -60 26z" fill="{BRAND}" opacity=".9"/>
    <g stroke="{HELMET}" stroke-width="5" opacity=".55" fill="none">
      <path d="M60 700 h1480"/><path d="M60 740 h980"/>
    </g>
  </g>'''
    write("hero.svg", frame(1600, 900, b, "#141A22", "#0A0D12", "OBRA IGR - SUSTITUIR POR FOTO REAL"))


def project(name, label, a, bb, accent):
    b = f'''  <g>
    <rect x="90" y="120" width="470" height="620" fill="#FFFFFF" fill-opacity=".07"/>
    <rect x="620" y="240" width="490" height="500" fill="#FFFFFF" fill-opacity=".05"/>
    <rect x="150" y="200" width="350" height="240" fill="{accent}" fill-opacity=".30"/>
    <g stroke="#FFFFFF" stroke-opacity=".22" stroke-width="3" fill="none">
      <path d="M150 500 h350"/><path d="M150 560 h240"/><path d="M680 330 h370"/><path d="M680 400 h250"/>
    </g>
    <circle cx="980" cy="580" r="86" fill="{accent}" fill-opacity=".35"/>
  </g>'''
    write(name, frame(1200, 900, b, a, bb, label))


def before_after():
    antes = '''  <g>
    <rect x="80" y="140" width="640" height="620" fill="#FFFFFF" fill-opacity=".05"/>
    <rect x="780" y="240" width="740" height="520" fill="#FFFFFF" fill-opacity=".04"/>
    <g stroke="#FFFFFF" stroke-opacity=".18" stroke-width="4" fill="none">
      <path d="M160 220 l90 130 -40 90 70 120"/><path d="M900 320 l120 90 -60 140"/>
      <path d="M1180 300 l60 180"/>
    </g>
    <rect x="240" y="520" width="260" height="240" fill="#000000" fill-opacity=".25"/>
  </g>'''
    write("antes.svg", frame(1600, 1000, antes, "#3A3A38", "#1C1C1B", "ANTES - FOTO REAL DE LA OBRA"))
    despues = f'''  <g>
    <rect x="80" y="140" width="640" height="620" fill="#FFFFFF" fill-opacity=".16"/>
    <rect x="780" y="240" width="740" height="520" fill="#FFFFFF" fill-opacity=".12"/>
    <rect x="150" y="230" width="480" height="300" fill="{HELMET}" fill-opacity=".38"/>
    <rect x="850" y="330" width="600" height="120" fill="{BRAND}" fill-opacity=".45"/>
    <g stroke="#FFFFFF" stroke-opacity=".4" stroke-width="4" fill="none">
      <path d="M150 600 h480"/><path d="M850 520 h600"/><path d="M850 600 h420"/>
    </g>
  </g>'''
    write("despues.svg", frame(1600, 1000, despues, "#20303F", "#101A24", "DESPUES - FOTO REAL DE LA OBRA"))


def og():
    b = f'''  <g font-family="Barlow Condensed, Arial Narrow, sans-serif" fill="#FFFFFF">
    <text x="80" y="300" font-size="120" letter-spacing="2">CONSTRUCCIONES Y</text>
    <text x="80" y="420" font-size="120" letter-spacing="2" fill="{BRAND}">REFORMAS IGR</text>
    <text x="82" y="500" font-size="42" fill="#C3CAD4" font-family="Inter, sans-serif">Reformas integrales llave en mano</text>
  </g>
  <rect x="80" y="540" width="180" height="10" fill="{HELMET}"/>'''
    write("og.svg", frame(1200, 630, b, "#141A22", "#0A0D12", ""))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print("Generando placeholders en", OUT)
    hero()
    project("proyecto-cocina.svg", "COCINA - FOTO REAL", "#2A2118", "#12100D", HELMET)
    project("proyecto-bano.svg", "BANO - FOTO REAL", "#16242B", "#0C1317", "#4FC3F7")
    project("proyecto-integral.svg", "REFORMA INTEGRAL - FOTO REAL", "#1E2430", "#0D1117", BRAND)
    project("proyecto-local.svg", "LOCAL COMERCIAL - FOTO REAL", "#231A26", "#110D13", "#B084F5")
    project("proyecto-fachada.svg", "FACHADA / SATE - FOTO REAL", "#20261C", "#0E120C", "#8BC34A")
    project("proyecto-salon.svg", "SALON - FOTO REAL", "#2A1D1D", "#130D0D", BRAND)
    before_after()
    og()
    print("Listo.")
