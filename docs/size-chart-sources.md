# Size chart sources

The stored charts live in `app/src/lib/sizing/charts/`. They were transcribed on 21 September 2026 from each brand's own website and have not yet been checked row by row against the source pages.

| Chart key | Source URL | Published unit | Measurements included | Notes | Status |
| --- | --- | --- | --- | --- | --- |
| `hm/mens/top` | https://th.hm.com/th_en/customer-service/sizeguide/men.html | cm | chest, waist | The Singapore site (www2.hm.com/en_sg) returned 403, so this is the H&M Thailand English page. Labels are EUR sizes, with the letter size from the page header where the page is consistent. | transcribed |
| `hm/mens/bottom` | https://th.hm.com/th_en/customer-service/sizeguide/men.html | cm | waist, hips (low hip), inseam | Thailand page, as above. Inside leg length is one value per size, converted to ranges at midpoints. | transcribed |
| `hm/womens/top` | https://th.hm.com/th_en/customer-service/sizeguide/ladies.html | cm | chest, waist, hips (low hip) | Thailand page, as above. The Indonesia page (id.hm.com) has the same numbers. | transcribed |
| `hm/womens/bottom` | https://th.hm.com/th_en/customer-service/sizeguide/ladies.html | cm | waist, hips (low hip) | Thailand page, as above. Inseam left out because the page lists 73 cm for every size. | transcribed |
| `cottonon/womens/top` | https://cottonon.com/SG/size-guide.html | cm | chest (bust), waist, hips (seat) | "Women's Clothing" tab. One value per size, converted to ranges at midpoints. Each row has the published value in a comment. | transcribed |
| `cottonon/womens/bottom` | https://cottonon.com/SG/size-guide.html | cm | waist, hips (seat) | Same table as the top chart. The page also lists thigh, which the app does not use. | transcribed |
| `lovebonito/womens/top` | https://www.lovebonito.com/intl/global/general-size-charts-old | cm | chest (bust), waist, hips | The Singapore page loads its tables in the browser and could not be read. The numbers come from the "General sizes" CM table image on this international page, which is marked "old" in its URL. One general table covers all clothing. | transcribed |
| `lovebonito/womens/bottom` | https://www.lovebonito.com/intl/global/general-size-charts-old | cm | waist, hips | Same general table as the top chart. | transcribed |
| `lovebonito/womens/dress` | https://www.lovebonito.com/intl/global/general-size-charts-old | cm | chest (bust), waist, hips | Same general table as the top chart. | transcribed |
| `nike/unisex/footwear` | https://www.nike.com/sg/size-fit/mens-footwear | cm | foot_length | Men's shoe chart, labelled in US men's sizes (US 3.5 to 22). One foot length per size, converted to ranges at midpoints. The page's "CM/JP" row is the shoe size, not foot length, so the "Foot length (cm)" row was used. | transcribed |
| `uniqlo/mens/top` | none | | | Uniqlo only shows body size charts inside each product page, loaded by script. The size pages that can be fetched (for example uniqlo.com/sg/en/size/436154_size.html) are garment measurements for one product. The FAQ pages on faq-sg.uniqlo.com explain how to measure but have no numbers. | not obtained |
| `uniqlo/mens/bottom` | none | | | As above. | not obtained |
| `uniqlo/womens/top` | none | | | As above. | not obtained |
| `uniqlo/womens/bottom` | none | | | As above. | not obtained |
| `zara/womens/top` | none | | | The Zara Singapore help page (zara.com/sg/en/help-center/MySize) says the measurement guide is on each product page. It has no general chart. | not obtained |
| `zara/womens/bottom` | none | | | As above. | not obtained |

## How to check

Open each source URL and compare every row in the matching chart file against the page, one size at a time. For charts marked as converted from single values, compare the published value in the row comment, then check that each range starts and ends halfway to the neighbouring sizes. For Love, Bonito, open the "General sizes" CM tab. For Nike, switch the chart to metric and read the "Foot length (cm)" row. Update this table when a chart passes, and note any number that changed.
