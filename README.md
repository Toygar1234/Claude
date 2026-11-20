# Kumdan Uzaya: SiO₂ sunum sitesi

9. sınıf kimya performans görevi için hazırlanmış, tek sayfalık etkileşimli site.

## Açmak

`index.html` dosyasını bir yerel sunucu üzerinden aç (Three.js modülleri `file://` ile yüklenmez):

```
python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresine git. GitHub Pages'te de aynı şekilde çalışır. Three.js `vendor/three` klasöründe olduğu için internet gerekmez; sadece yazı tipleri Google Fonts'tan gelir (internet yoksa sistem yazı tipi kullanılır).

## Metinleri değiştirmek

Bütün metinler `src/` klasöründeki HTML dosyalarında:

| Dosya | İçerik |
|---|---|
| `src/body1.html` | Üst menü, ana ekran (SiO₂ / Kuvars / Cam / Stişovit), Giriş, ürün yayı |
| `src/body2.html` | Dokuz ürünün detay ekranı metinleri |
| `src/body3.html` | 01 Kimlik kartı, 02 Yapı, 03 Polimorflar, 04 Üretim, 05 Günlük hayat, 06 Havacılık |
| `src/body4.html` | 07 Uzay, 08 Aerojel, 09 Savunma, 10 Sağlık, 11 Çevre |
| `src/body5.html` | 12 Sayılar, 13 Zaman çizelgesi, 14 Deneyler, 15 Quiz, 16 Sonuç, Sözlük, Kaynakça |

Değişiklikten sonra `python3 tools/build.py` komutu `index.html` dosyasını yeniden üretir.

## Yapı

- `src/styles.css`: tasarım ve renkler
- `src/js/`: ana ekran kaydırıcısı, detay ekranı, grafikler ve hesaplayıcılar
- `src/js/3d/`: Three.js ile kodda üretilen 3B modeller (atom modeli, kuvars, çay bardağı, diş macunu, silika jel, yonga plakası, optik fiber, aerojel, LI-900 karosu, radom)

Sitedeki bütün 3B modeller ve çizimler kodla üretildi; fotoğraf kullanılmadı.
