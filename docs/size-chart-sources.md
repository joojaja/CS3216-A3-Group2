# Size chart sources

The stored charts live in `app/src/lib/sizing/charts/`. They were transcribed on 21 September 2026 (the Cotton On men's charts and the Adidas, Charles & Keith, Gap, Levi's and Mango charts on 24 September) from each brand's own website and have not yet been checked row by row against the source pages.

| Chart key | Source URL | Published unit | Measurements included | Notes | Status |
| --- | --- | --- | --- | --- | --- |
| `hm/mens/top` | https://th.hm.com/th_en/customer-service/sizeguide/men.html | cm | chest, waist | The Singapore site (www2.hm.com/en_sg) returned 403, so this is the H&M Thailand English page. Labels are EUR sizes, with the letter size from the page header where the page is consistent. | transcribed |
| `hm/mens/bottom` | https://th.hm.com/th_en/customer-service/sizeguide/men.html | cm | waist, hips (low hip), inseam | Thailand page, as above. Inside leg length is one value per size, converted to ranges at midpoints. | transcribed |
| `hm/womens/top` | https://th.hm.com/th_en/customer-service/sizeguide/ladies.html | cm | chest, waist, hips (low hip) | Thailand page, as above. The Indonesia page (id.hm.com) has the same numbers. | transcribed |
| `hm/womens/bottom` | https://th.hm.com/th_en/customer-service/sizeguide/ladies.html | cm | waist, hips (low hip) | Thailand page, as above. Inseam left out because the page lists 73 cm for every size. | transcribed |
| `cottonon/womens/top` | https://cottonon.com/SG/size-guide.html | cm | chest (bust), waist, hips (seat) | "Women's Clothing" tab. One value per size, converted to ranges at midpoints. Each row has the published value in a comment. | transcribed |
| `cottonon/womens/bottom` | https://cottonon.com/SG/size-guide.html | cm | waist, hips (seat) | Same table as the top chart. The page also lists thigh, which the app does not use. | transcribed |
| `cottonon/mens/top` | https://cottonon.com/SG/size-guide.html | cm | chest | "Men's Tops" table, retrieved 24 September 2026. Chest only, one value per size, converted to ranges at midpoints. The inch table on the page agrees with the cm values. | transcribed |
| `cottonon/mens/bottom` | https://cottonon.com/SG/size-guide.html | cm | waist, hips (seat) | "Men's Bottoms" table, retrieved 24 September 2026, converted the same way. "Men's Denim" repeats it. The page also lists thigh, which the app does not use. | transcribed |
| `lovebonito/womens/top` | https://www.lovebonito.com/intl/global/general-size-charts-old | cm | chest (bust), waist, hips | The Singapore page loads its tables in the browser and could not be read. The numbers come from the "General sizes" CM table image on this international page, which is marked "old" in its URL. One general table covers all clothing. | transcribed |
| `lovebonito/womens/bottom` | https://www.lovebonito.com/intl/global/general-size-charts-old | cm | waist, hips | Same general table as the top chart. | transcribed |
| `lovebonito/womens/dress` | https://www.lovebonito.com/intl/global/general-size-charts-old | cm | chest (bust), waist, hips | Same general table as the top chart. | transcribed |
| `nike/unisex/footwear` | https://www.nike.com/sg/size-fit/mens-footwear | cm | foot_length | Men's shoe chart, labelled in US men's sizes (US 3.5 to 22). One foot length per size, converted to ranges at midpoints. The page's "CM/JP" row is the shoe size, not foot length, so the "Foot length (cm)" row was used. | transcribed |
| `adidas/mens/top` | https://support.dtb.adidas.com/static-content/size-charts/en_GB/apparel/size-m_tops.html | cm | chest, waist, hips | adidas.com.sg returned 403, so this is the en_GB chart on Adidas's support site. Standard table only; Tall and Short tables left out. Ranges as published. | transcribed |
| `adidas/mens/bottom` | https://support.dtb.adidas.com/static-content/size-charts/en_GB/apparel/size-m_bottoms.html | cm | waist, hips | As above. Inseam left out because the published values fall after XL. | transcribed |
| `adidas/womens/top` | https://support.dtb.adidas.com/static-content/size-charts/en_GB/apparel/size-w_tops.html | cm | chest (bust), waist, hips | As above. | transcribed |
| `adidas/womens/bottom` | https://support.dtb.adidas.com/static-content/size-charts/en_GB/apparel/size-w_bottoms.html | cm | waist, hips | As above. The page labels the largest size XXL where the tops page says 2XL. Inseam left out to match the men's chart. | transcribed |
| `charlesandkeith/womens/footwear` | https://www.charleskeith.com/sg/information/shopping-with-us/size-guide.html | cm | foot_length | "Length of Foot (CM)" column of the women's shoe table. One value per size, converted to ranges at midpoints. The JP/KR column is a size label and is not used. | transcribed |
| `gap/womens/top` | https://www.gap.co.uk/size-guide | cm | chest (bust), waist, hips | gap.com loads its charts by script, so this is Gap UK. "Women's Clothing" table, ranges as published. The 2XS row read differently on every fetch and was left out. | transcribed |
| `gap/womens/bottom` | https://www.gap.co.uk/size-guide | cm | waist, hips | "Women's Jeans" table, one value per size, converted to ranges at midpoints. Inseam depends on leg length, not size, so it is left out. | transcribed |
| `gap/mens/top` | https://www.gap.co.uk/size-guide | cm | chest | "Men's Clothing" table. Neck and sleeve not used. XXXL is a single value (140). | transcribed |
| `gap/mens/bottom` | https://www.gap.co.uk/size-guide | cm | waist | "Men's Jeans" table, one value per size, converted to ranges at midpoints. | transcribed |
| `levis/mens/bottom` | https://levi.com.sg/pages/men-sizechart-bottoms | cm | waist, hips (seat) | Men's numeric chart, ranges as published. The page does not say clearly whether it is body or garment; stored as body. Thigh values look wrong and are not used. | transcribed |
| `mango/womens/top` | https://shop.mango.com/sg/en/size-guide | cm | chest (bust), waist, hips | One women's table, one value per size, converted to ranges at midpoints. Matches the US page in inches. In-between labels (XS-S and so on) repeat the larger size and are left out. | transcribed |
| `mango/womens/bottom` | https://shop.mango.com/sg/en/size-guide | cm | waist, hips | The same table. The page does not say which garments it covers. | transcribed |
| `mango/womens/dress` | https://shop.mango.com/sg/en/size-guide | cm | chest (bust), waist, hips | The same table. | transcribed |
| `uniqlo/mens/top` | none | | | Uniqlo only shows body size charts inside each product page, loaded by script. The size pages that can be fetched (for example uniqlo.com/sg/en/size/436154_size.html) are garment measurements for one product. The FAQ pages on faq-sg.uniqlo.com explain how to measure but have no numbers. | not obtained |
| `uniqlo/mens/bottom` | none | | | As above. | not obtained |
| `uniqlo/womens/top` | none | | | As above. | not obtained |
| `uniqlo/womens/bottom` | none | | | As above. | not obtained |
| `zara/womens/top` | none | | | The Zara Singapore help page (zara.com/sg/en/help-center/MySize) says the measurement guide is on each product page. It has no general chart. | not obtained |
| `zara/womens/bottom` | none | | | As above. | not obtained |

## Other brands tried on 24 September 2026

These had no general chart that could be read, so none is stored:

- **Zara, Bershka, Pull&Bear:** the size guide pages returned 403.
- **Pomelo, Shein:** charts are per product, or loaded by script.
- **ASOS:** every size chart page timed out.
- **Love, Bonito (current page):** the Singapore general size chart page now only explains how to measure and points to each product's guide. The stored charts come from the older international page.
- **Muji:** the EU women's page maps letters to UK and EU sizes with no measurements. The men's page gives a different chest for each garment type, which looks like garment sizes. The US chart is an image only.
- **Cotton On dresses and shoes:** there is no separate dress table, and the shoe tables are size conversions with no foot length.
- **Adidas shoes, Mango men's:** the shoe chart returned 403, and Mango has no men's table.
- **Levi's women's:** the page is internally inconsistent (seat smaller than waist in one table, and mismatched cm and inch labels).

## How to check

Open each source URL and compare every row in the matching chart file against the page, one size at a time. For charts marked as converted from single values, compare the published value in the row comment, then check that each range starts and ends halfway to the neighbouring sizes. For Love, Bonito, open the "General sizes" CM tab. For Nike, switch the chart to metric and read the "Foot length (cm)" row. Update this table when a chart passes, and note any number that changed.
