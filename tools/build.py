#!/usr/bin/env python3
"""Builds index.html (repo / GitHub Pages, local three.js) and dist/artifact.html (claude.ai Artifact, jsDelivr)."""
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
THREE_VER = '0.183.2'
UI_JS = ['00-ui-core.js', '10-hero-ui.js', '20-detail-ui.js', '30-wheel-ui.js', '40-widgets-a.js', '41-widgets-b.js', '42-widgets-c.js']
JS3D = ['00-core.js', '10-atoms.js', '20-pieces.js', '30-products.js', '40-hero3d.js', '50-wheel3d.js', '60-detail3d.js', '99-start.js']
BODY = ['body1.html', 'body2.html', 'body3.html', 'body4.html', 'body5.html']
TITLE = 'Kumdan Uzaya'
DESC = 'Silisyum dioksit (SiO₂): kumdan uzaya. 3B atom modeli, ürünler, grafikler ve hesaplarla 9. sınıf kimya sunum sitesi.'
FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Poppins:wght@300;400;500;600;700;800&display=swap'

def read(p): return (SRC / p).read_text(encoding='utf-8')

def script(importmap):
    ui = '\n'.join(read('js/' + f) for f in UI_JS)
    three = '\n'.join(read('js/3d/' + f) for f in JS3D)
    boot = f"""
async function boot3D() {{
  const [THREE_, RB, CG, BGU, IN] = await Promise.all([
    import('three'),
    import('three/addons/geometries/RoundedBoxGeometry.js'),
    import('three/addons/geometries/ConvexGeometry.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
    import('three/addons/math/ImprovedNoise.js')
  ]);
  const THREE = THREE_;
  const {{ RoundedBoxGeometry }} = RB, {{ ConvexGeometry }} = CG, {{ mergeGeometries, mergeVertices }} = BGU, {{ ImprovedNoise }} = IN;
{three}
  return start3D();
}}
"""
    main = read('js/90-main.js')
    im = json.dumps({'imports': importmap}, ensure_ascii=False)
    return f'<script type="importmap">{im}</script>\n<script type="module">\n{ui}\n{boot}\n{main}\n</script>'

def head(extra=''):
    css = read('styles.css')
    return f'''<title>{TITLE}</title>
{extra}<meta name="description" content="{DESC}">
<meta name="theme-color" content="#ffffff">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>
{css}
</style>'''

def main():
    body = '\n'.join(read(f) for f in BODY)
    local = {'three': './vendor/three/build/three.module.min.js', 'three/addons/': './vendor/three/examples/jsm/'}
    cdn = {'three': f'https://cdn.jsdelivr.net/npm/three@{THREE_VER}/build/three.module.min.js', 'three/addons/': f'https://cdn.jsdelivr.net/npm/three@{THREE_VER}/examples/jsm/'}
    full = f'''<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head()}
</head>
<body>
{body}
{script(local)}
</body>
</html>
'''
    (ROOT / 'index.html').write_text(full, encoding='utf-8')
    art = f'''{head('<meta name="claude:viewport-fit-sides" content="cover">\n')}
{body}
{script(cdn)}
'''
    (ROOT / 'dist').mkdir(exist_ok=True)
    (ROOT / 'dist' / 'artifact.html').write_text(art, encoding='utf-8')
    print('index.html', len(full) // 1024, 'KB; dist/artifact.html', len(art) // 1024, 'KB')

if __name__ == '__main__':
    main()
