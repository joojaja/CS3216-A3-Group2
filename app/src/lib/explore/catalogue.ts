export type ExploreProduct = {
  id: string;
  retailer: string;
  name: string;
  productUrl: string;
  imageUrl: string;
  price: string;
  category: "top" | "bottom" | "outerwear" | "dress";
  colour: string;
  styles: string[];
  weatherTags: string[];
  fitLine: "men" | "women";
};

const muji = (
  code: string,
  details: Omit<ExploreProduct, "id" | "retailer" | "productUrl" | "imageUrl">,
): ExploreProduct => ({
  id: `muji-${code}`,
  retailer: "MUJI Singapore",
  productUrl: `https://www.muji.com/sg/products/cmdty/detail/${code}`,
  imageUrl: `https://img.muji.net/img/item/${code}_1260.jpg`,
  ...details,
});

type RetailerDetails = Pick<
  ExploreProduct,
  "name" | "price" | "category" | "colour" | "fitLine"
> & {
  styles?: string[];
  weatherTags?: string[];
};

const decathlon = (
  slug: string,
  mediaPath: string,
  details: RetailerDetails,
): ExploreProduct => ({
  id: "decathlon-" + slug,
  retailer: "Decathlon Singapore",
  productUrl: "https://www.decathlon.sg/p/" + slug + ".html",
  imageUrl:
    "https://contents.mediadecathlon.com/" + mediaPath + "/" + slug + ".jpg",
  styles: details.styles ?? ["sporty", "casual"],
  weatherTags:
    details.weatherTags ??
    (details.category === "outerwear"
      ? ["rain", "air_conditioned"]
      : ["hot_humid"]),
  ...details,
});

const uniqlo = (
  productCode: string,
  imageCode: string,
  colourCode: string,
  details: RetailerDetails,
): ExploreProduct => ({
  id: "uniqlo-" + productCode,
  retailer: "UNIQLO Singapore",
  productUrl:
    "https://www.uniqlo.com/sg/en/products/E" +
    productCode +
    "-000/00?colorDisplayCode=" +
    colourCode,
  imageUrl:
    "https://image.uniqlo.com/UQ/ST3/sg/imagesgoods/" +
    imageCode +
    "/item/sggoods_" +
    colourCode +
    "_" +
    imageCode +
    "_3x4.jpg?width=600",
  styles: details.styles ?? ["casual", "minimal"],
  weatherTags: details.weatherTags ?? ["hot_humid"],
  ...details,
});

// This controlled catalogue uses products listed on each retailer's Singapore
// site. Availability can change, so the interface tells users to confirm the
// current price, size and stock with the retailer.
export const EXPLORE_CATALOGUE: ExploreProduct[] = [
  muji("4547315485413", { name: "UV protection quick-dry waffle T-shirt", price: "$29.90", category: "top", colour: "off white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723380362", { name: "Lyocell-blend half-sleeve shirt", price: "$49.90", category: "top", colour: "off white", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723239424", { name: "Ripstop cargo shorts", price: "$49.90", category: "bottom", colour: "black", styles: ["casual", "utility"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723196673", { name: "Quick-dry washable polo", price: "$49.90", category: "top", colour: "medium grey stripe", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723185738", { name: "Breathable wide-fit straight pants", price: "$59.90", category: "bottom", colour: "navy", styles: ["casual", "minimal"], weatherTags: ["hot_humid", "air_conditioned"], fitLine: "men" }),
  muji("4550723181549", { name: "Water-repellent hooded jacket", price: "$59.90", category: "outerwear", colour: "charcoal grey", styles: ["casual", "utility"], weatherTags: ["rain"], fitLine: "men" }),
  muji("4550723180825", { name: "Stretch jersey jacket", price: "$99.90", category: "outerwear", colour: "dark grey", styles: ["business", "smart casual"], weatherTags: ["air_conditioned"], fitLine: "men" }),
  muji("4550723176569", { name: "Quick-dry darted wide-fit pants", price: "$59.90", category: "bottom", colour: "charcoal grey", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4548076937784", { name: "Kapok-blend double-gauze shirt", price: "$39.90", category: "top", colour: "white", styles: ["casual", "natural"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4548076426288", { name: "Washed broadcloth short-sleeve shirt", price: "$29.90", category: "top", colour: "white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723552455", { name: "Washed denim easy tapered pants", price: "$29.90", category: "bottom", colour: "blue", styles: ["casual", "classic"], weatherTags: ["all_weather"], fitLine: "women" }),
  muji("4550723502665", { name: "Straight hakama pants", price: "$59.90", category: "bottom", colour: "black", styles: ["minimal", "smart casual"], weatherTags: ["all_weather"], fitLine: "women" }),
  muji("4550723361491", { name: "Smooth easy tapered pants", price: "$39.90", category: "bottom", colour: "charcoal grey", styles: ["casual", "minimal"], weatherTags: ["all_weather"], fitLine: "women" }),
  muji("4550723424110", { name: "Lyocell-blend half-sleeve blouse", price: "$49.90", category: "top", colour: "black", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723179027", { name: "Washed broadcloth regular-collar shirt", price: "$39.90", category: "top", colour: "white", styles: ["classic", "smart casual"], weatherTags: ["air_conditioned", "all_weather"], fitLine: "women" }),
  muji("4550723165686", { name: "Lyocell openwork polo cardigan", price: "$49.90", category: "outerwear", colour: "black", styles: ["smart casual", "minimal"], weatherTags: ["air_conditioned"], fitLine: "women" }),
  muji("4550723071819", { name: "High-twist jersey sleeveless dress", price: "$49.90", category: "dress", colour: "charcoal grey", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723077033", { name: "Cool-touch wide-fit T-shirt", price: "$19.90", category: "top", colour: "white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723074995", { name: "Cool-touch anti-sweat-stain T-shirt", price: "$19.90", category: "top", colour: "white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723563093", { name: "UV protection quick-dry zip hoodie", price: "$49.90", category: "outerwear", colour: "medium grey", styles: ["casual", "sporty"], weatherTags: ["rain", "air_conditioned"], fitLine: "women" }),
  muji("4550512649656", { name: "Water-repellent hooded jacket", price: "$79.90", category: "outerwear", colour: "beige", styles: ["casual", "utility"], weatherTags: ["rain"], fitLine: "women" }),
  uniqlo("486614", "486614", "09", { name: "Easy Care Soft Shirt", price: "$39.90", category: "top", colour: "black", fitLine: "men", styles: ["smart casual", "minimal"], weatherTags: ["air_conditioned", "all_weather"] }),
  uniqlo("422992", "485563", "00", { name: "Crew Neck Short Sleeve T-Shirt", price: "$14.90", category: "top", colour: "white", fitLine: "men" }),
  decathlon("men-s-hiking-trousers-mh100-grey-quechua-8767072", "p2583128/k$a592811ab42c7cfab9ad0020787aca58", { name: "Men's Hiking Trousers MH100", price: "$19.90", category: "bottom", colour: "grey", fitLine: "men", styles: ["outdoor", "utility"] }),
  decathlon("men-s-2-in-1-breathable-fitness-shorts-with-zip-pocket-domyos-8947827", "p3057572/k$5034cb1bf48bad2208cafcf8d1f3ee9a", { name: "Men's 2-in-1 Breathable Fitness Shorts", price: "$22.90", category: "bottom", colour: "black", fitLine: "men" }),
  decathlon("men-s-running-shorts-run-500-dry-blue-kiprun-8773906", "p2788609/k$d330f10d8a2a4f624f685b89784eeea1", { name: "Men's Running Shorts Run 500 Dry", price: "$7.90", category: "bottom", colour: "blue", fitLine: "men" }),
  decathlon("men-s-hiking-shorts-nh500-cargo-brown-quechua-8919764", "p3069472/k$a48bf4f561168f9994b84ebdf02032ef", { name: "Men's Hiking Cargo Shorts NH500", price: "$39.90", category: "bottom", colour: "brown", fitLine: "men", styles: ["outdoor", "utility"] }),
  decathlon("men-s-shorts-sm-s092-2602-easy23-s-jet-black-jasmine-green-yonex-1414ec57-e5e0-4b85-a456-daf00b649481", "m15677915/k$50aba7289ecd6da38569e8e62395440c", { name: "Men's Yonex Easy Shorts", price: "$20.90", category: "bottom", colour: "black", fitLine: "men" }),
  decathlon("men-s-running-premium-tank-top-900-kiprun-kiprun-8903102", "p2788642/k$42fd5aa27d59be27cddbb8e480e8fec9", { name: "Men's Running Premium Tank Top 900", price: "$19.90", category: "top", colour: "black", fitLine: "men" }),
  decathlon("men-s-waterproof-jacket-run-100-blue-kiprun-8852456", "p2846121/k$3744bda702f523e1064580e69325b928", { name: "Men's Waterproof Running Jacket Run 100", price: "$29.90", category: "outerwear", colour: "blue", fitLine: "men" }),
  decathlon("men-s-breathable-tennis-shorts-dry-gaël-monfils-green-kuikma-8997111", "p3023479/k$0f89e40e929f91e44df40deb68cb37ff", { name: "Men's Breathable Tennis Shorts Dry+", price: "$19.90", category: "bottom", colour: "green", fitLine: "men" }),
  decathlon("men-s-kiprun-run-100-windproof-running-trail-running-jacket-white-cotton-kiprun-8926453", "p2709164/k$7c314b4e44bb31ea2bf52a0b069bbfd9", { name: "Men's Run 100 Windproof Running Jacket", price: "$10.90", category: "outerwear", colour: "white", fitLine: "men" }),
  decathlon("men-s-essentials-cotton-t-shirt-burgundy-domyos-8773500", "p2404798/k$acc85bb2c4b99e52a2e280dae4ccf7e5", { name: "Men's Essentials Cotton T-Shirt", price: "$9.90", category: "top", colour: "burgundy", fitLine: "men" }),
  decathlon("men-s-breathable-fitness-t-shirt-khaki-domyos-8912632", "p2826662/k$ce6f9913ebdcdc3611764dc01a49664d", { name: "Men's Breathable Fitness T-Shirt", price: "$9.90", category: "top", colour: "khaki", fitLine: "men" }),
  decathlon("men-s-waterproof-hiking-jacket-nh500-green-quechua-8844508", "p2644218/k$12141a8e74ca8319028c3ab78c27a470", { name: "Men's Waterproof Hiking Jacket NH500", price: "$45.90", category: "outerwear", colour: "green", fitLine: "men", styles: ["outdoor", "utility"] }),
  decathlon("men-s-trail-running-t-shirt-kiprun-run-500-green-kiprun-8969999", "p3163621/k$13224ad90d485974cc4497883539018e", { name: "Men's Trail Running T-Shirt Run 500", price: "$24.90", category: "top", colour: "green", fitLine: "men" }),
  decathlon("men-s-polo-t-shirt-pm-s092-2482-easy-23-s-porcelain-blue-yonex-53caa8cf-f3ac-4bd8-b5f1-47a3f0ecb405", "m15673521/k$f06292afe26c6b2b2be813143066ce47", { name: "Men's Yonex Polo T-Shirt", price: "$27.90", category: "top", colour: "light blue", fitLine: "men", styles: ["sporty", "smart casual"] }),
  decathlon("men-s-run-500-comfort-running-shorts-anthracite-grey-kiprun-8830912", "p2600286/k$f6e1919ef7713cd2655f6f296532cb40", { name: "Men's Run 500 Comfort Running Shorts", price: "$19.90", category: "bottom", colour: "charcoal grey", fitLine: "men" }),
  decathlon("men-s-stretchy-fitness-tank-top-500-white-domyos-8667062", "p2731077/k$1e73eea8d727c1e768e61aafa0edc800", { name: "Men's Stretchy Fitness Tank Top 500", price: "$8.90", category: "top", colour: "white", fitLine: "men" }),
  decathlon("men-s-women-s-basketball-3-4-leggings-500-nba-golden-state-warriors-blue-tarmak-8751420", "p2333315/k$3346da7c70455fbee00b81eec62cf03a", { name: "Basketball 3/4 Leggings 500", price: "$19.90", category: "bottom", colour: "blue", fitLine: "men" }),
  decathlon("men-s-basketball-capri-leggings-nba-tight-900-black-tarmak-8916586", "p3177007/k$bb814046510cee973b9fdb62c9706c4c", { name: "Men's Basketball Capri Leggings 900", price: "$24.90", category: "bottom", colour: "black", fitLine: "men" }),
  decathlon("men-s-water-repellent-trekking-pants-mt500-mt500-simond-8853731", "p2660450/k$90537c584cd48bfea63bd2e78cbad75f", { name: "Men's Water-Repellent Trekking Pants MT500", price: "$49.90", category: "bottom", colour: "grey", fitLine: "men", styles: ["outdoor", "utility"], weatherTags: ["hot_humid", "rain"] }),
  decathlon("men-s-breathable-dry-tennis-shorts-grey-kuikma-8968181", "p3023577/k$ba7dc47fd9bbd8abefa12516c8144894", { name: "Men's Breathable Tennis Shorts", price: "$14.90", category: "bottom", colour: "grey", fitLine: "men" }),
  decathlon("men-mountain-hiking-short-sleeved-t-shirt-mh100-grey-quechua-8612136", "p2153632/k$c37f9bc4127ab199c1edaa49e872cd75", { name: "Men's Mountain Hiking T-Shirt MH100", price: "$6.90", category: "top", colour: "grey", fitLine: "men", styles: ["outdoor", "casual"] }),
  decathlon("men-s-regular-fit-fitness-shorts-black-domyos-8405360", "p1984250/k$e696b6628abed95854f3bf4472822556", { name: "Men's Regular-Fit Fitness Shorts", price: "$16.90", category: "bottom", colour: "black", fitLine: "men" }),
  decathlon("men-golf-polo-shirt-mw500-short-sleeved-inesis-8842816", "p2950244/k$281bde6cb4834b0bf44391edf7193dd4", { name: "Men's Golf Polo Shirt MW500", price: "$11.90", category: "top", colour: "blue", fitLine: "men", styles: ["sporty", "smart casual"] }),
  decathlon("men-s-2-in-1-running-shorts-kiprun-run-500-comfort-navy-blue-kiprun-8960453", "p3013162/k$2a261705a3d1e5462187ffa970c164f3", { name: "Men's 2-in-1 Running Shorts Run 500", price: "$29.90", category: "bottom", colour: "navy", fitLine: "men" }),
  decathlon("men-s-cotton-fitness-shorts-dark-grey-domyos-8601427", "p2073168/k$09fa82c126f3049bc2b76e18d708fa5a", { name: "Men's Cotton Fitness Shorts", price: "$8.90", category: "bottom", colour: "dark grey", fitLine: "men" }),
  decathlon("men-badminton-t-shirt-perfly-530-navy-yellow-perfly-8553617", "p1778024/k$e9efa92f96c3e02081678f76c868a2ef", { name: "Men's Badminton T-Shirt Perfly 530", price: "$7.00", category: "top", colour: "navy", fitLine: "men" }),
  decathlon("men-s-women-s-basketball-shorts-100-black-kipsta-8941326", "p2938594/k$b3da292f2a951c176743027b780c60d4", { name: "Basketball Shorts 100", price: "$6.90", category: "bottom", colour: "black", fitLine: "men" }),
  decathlon("men-s-kiprun-run-100-running-t-shirt-blue-kiprun-8955567", "p3014867/k$646f8f9ef83b0317625c755ee0714114", { name: "Men's Run 100 Running T-Shirt", price: "$6.90", category: "top", colour: "blue", fitLine: "men" }),
  decathlon("men-s-running-3-4-pants-black-kiprun-8872865", "p2836740/k$5ac721232ae5ef8c2e767a9b3cbd5ed7", { name: "Men's Running 3/4 Pants", price: "$14.90", category: "bottom", colour: "black", fitLine: "men" }),
  decathlon("men-s-fitness-regular-shorts-navy-blue-domyos-8873601", "p2864260/k$64830656d909295f8d9df92f7462ff91", { name: "Men's Fitness Regular Shorts", price: "$9.90", category: "bottom", colour: "navy", fitLine: "men" }),
  decathlon("men-polo-t-shirt-pm-s092-2624-easy3-s-true-red-yonex-83ad8f6f-6e78-49e0-a23b-c6964d6742a6", "m17788727/k$3a0572c50403f1021ab8dbf3c3e44e82", { name: "Men's Yonex Polo T-Shirt", price: "$32.00", category: "top", colour: "red", fitLine: "men", styles: ["sporty", "smart casual"] }),
  decathlon("men-s-woven-shorts-elementals-blue-decathlon-8947497", "p2848984/k$8a82342243dbf356fb0b3153c463a81f", { name: "Men's Elementals Woven Shorts", price: "$16.90", category: "bottom", colour: "blue", fitLine: "men" }),
  decathlon("women-s-fitness-zip-up-sweatshirt-100-black-domyos-8736710", "p2568596/k$699b0f373814bbc1988b1d99be3509c0", { name: "Women's Fitness Zip-Up Sweatshirt 100", price: "$19.90", category: "outerwear", colour: "black", fitLine: "women", weatherTags: ["air_conditioned"] }),
  decathlon("women-s-fitness-shorts-520-light-mottled-grey-domyos-8772641", "p2633557/k$22c2229a297e8eef053d1ee46092b167", { name: "Women's Fitness Shorts 520", price: "$8.90", category: "bottom", colour: "light grey", fitLine: "women" }),
  decathlon("women-s-rain-kiprun-run-100-jacket-white-kalenji-8853513", "p2516841/k$44ba4f0095aedbcf0d785545e13fc5c1", { name: "Women's Rain Running Jacket Run 100", price: "$29.90", category: "outerwear", colour: "white", fitLine: "women" }),
  decathlon("women-s-cardio-fitness-double-layer-shorts-blue-domyos-8841864", "p2629340/k$dd04695315eb0e923090acd361630435", { name: "Women's Cardio Fitness Double-Layer Shorts", price: "$7.90", category: "bottom", colour: "blue", fitLine: "women" }),
  decathlon("women-s-cardio-fitness-cropped-tank-top-black-domyos-8797872", "p2731622/k$4d97875662ef762e77cf51b5207af51b", { name: "Women's Cardio Fitness Cropped Tank Top", price: "$7.90", category: "top", colour: "black", fitLine: "women" }),
  decathlon("women-s-short-sleeved-fitness-cardio-t-shirt-soft-pink-domyos-8969049", "p3074771/k$d7e34b3f95dddb93a2e4a4854a75fe67", { name: "Women's Short-Sleeved Fitness T-Shirt", price: "$6.90", category: "top", colour: "pink", fitLine: "women" }),
  decathlon("women-s-regular-shorts-black-domyos-8948551", "p3076168/k$e98a6e4376457d9b51f9bed35314bc52", { name: "Women's Regular Fitness Shorts", price: "$12.90", category: "bottom", colour: "black", fitLine: "women" }),
  decathlon("women-s-lightweight-running-trail-shorts-kiprun-run-900-light-navy-blue-kiprun-8911295", "p2789789/k$7bfc66d742008340efee804312e3a3ed", { name: "Women's Lightweight Running and Trail Shorts", price: "$29.90", category: "bottom", colour: "navy", fitLine: "women" }),
  decathlon("women-s-fitness-high-waisted-leggings-grey-print-domyos-8916808", "p2919810/k$08764b175569f68a90bddb6de7833020", { name: "Women's High-Waisted Fitness Leggings", price: "$16.90", category: "bottom", colour: "grey", fitLine: "women" }),
  decathlon("women-s-hiking-skirt-zip-off-nh900-carbon-grey-quechua-8974185", "p3087606/k$7ca60bc6f0b2dbf148657d14b1194432", { name: "Women's Zip-Off Hiking Skirt NH900", price: "$49.90", category: "bottom", colour: "charcoal grey", fitLine: "women", styles: ["outdoor", "utility"] }),
  decathlon("women-mountain-walking-short-sleeved-t-shirt-mh100-grey-blue-quechua-8612421", "p2201518/k$df9a74d793d68ed0ff5d0be8ba48cbb0", { name: "Women's Mountain Walking T-Shirt MH100", price: "$6.90", category: "top", colour: "grey blue", fitLine: "women", styles: ["outdoor", "casual"] }),
  decathlon("women-s-slim-fit-cotton-cycling-shorts-black-domyos-8511786", "p2632571/k$5df3674f7f8231d9a5de1b36680dcbf4", { name: "Women's Slim-Fit Cotton Cycling Shorts", price: "$8.90", category: "bottom", colour: "black", fitLine: "women" }),
  decathlon("women-s-anti-uv-pants-dark-grey-quechua-8857776", "p2653344/k$4a8eb1fd306d599e1e885339996f4cdc", { name: "Women's Anti-UV Pants", price: "$24.90", category: "bottom", colour: "dark grey", fitLine: "women", styles: ["outdoor", "utility"] }),
  decathlon("women-s-oversized-trousers-black-decathlon-8926326", "p2845312/k$566ba53e62a1f324300051773d1f3bdb", { name: "Women's Oversized Trousers", price: "$24.90", category: "bottom", colour: "black", fitLine: "women", styles: ["casual", "minimal"] }),
  decathlon("women-badminton-t-shirt-perfly-530-purple-perfly-8603014", "p1930858/k$f091850d76787d3add90f04becc42d8a", { name: "Women's Badminton T-Shirt Perfly 530", price: "$13.00", category: "top", colour: "purple", fitLine: "women" }),
  decathlon("women-s-stretchy-straight-sports-leggings-brown-domyos-8957633", "p2919785/k$cbbc00e2152726d3d7d2562160321d58", { name: "Women's Straight Sports Leggings", price: "$14.90", category: "bottom", colour: "brown", fitLine: "women" }),
  decathlon("women-s-breathable-running-cropped-leggings-dark-khaki-kiprun-8804223", "p2396832/k$b43516f1c2fb76a2b1eb6ebbc99ed390", { name: "Women's Breathable Cropped Running Leggings", price: "$9.90", category: "bottom", colour: "khaki", fitLine: "women" }),
  decathlon("women-s-surfing-top-black-olaian-8810054", "p2669381/k$6f872a1139b452c093864c2c6012d562", { name: "Women's Surfing Top", price: "$14.90", category: "top", colour: "black", fitLine: "women" }),
  decathlon("women-s-running-2-in-1-skirt-black-kiprun-8938748", "p2838307/k$1f468737079a12b70cbd92107ea7bfef", { name: "Women's 2-in-1 Running Skirt", price: "$29.90", category: "bottom", colour: "black", fitLine: "women" }),
  decathlon("women-s-high-rise-bootcut-pants-520-dark-grey-domyos-8913936", "p2818699/k$4a2250986197425b41f6a6345e39fe0d", { name: "Women's High-Rise Bootcut Pants 520", price: "$29.90", category: "bottom", colour: "dark grey", fitLine: "women" }),
  decathlon("women-s-hiking-t-shirt-nh500-quechua-8984991", "p3055647/k$38c928de0d18a23024eb5b73df43a9ad", { name: "Women's Hiking T-Shirt NH500", price: "$12.90", category: "top", colour: "neutral", fitLine: "women", styles: ["outdoor", "casual"] }),
  decathlon("women-s-windproof-and-water-repellent-hiking-jacket-raincut-full-zip-white-quechua-8383702", "p2643938/k$08687c9f7dea47f5c34bbce5edcc2084", { name: "Women's Raincut Water-Repellent Hiking Jacket", price: "$19.90", category: "outerwear", colour: "white", fitLine: "women", styles: ["outdoor", "utility"] }),
  decathlon("women-s-hiking-waterproof-jacket-nh500-green-quechua-8871470", "p2844188/k$a18d7c390d27ecb76d9f2ba572a2c0c1", { name: "Women's Waterproof Hiking Jacket NH500", price: "$39.90", category: "outerwear", colour: "green", fitLine: "women", styles: ["outdoor", "utility"] }),
  decathlon("women-s-waterproof-breathable-trail-running-jacket-kiprun-run-500-black-kiprun-8945836", "p2907523/k$6ced9c27f485771a33b97366327569c1", { name: "Women's Waterproof Trail Running Jacket Run 500", price: "$64.90", category: "outerwear", colour: "black", fitLine: "women" }),
  decathlon("women-s-breathable-running-t-shirt-kiprun-run-500-pink-kiprun-8968540", "p3193362/k$2b5d7a33f8995be4dbec767b93145e3d", { name: "Women's Breathable Running T-Shirt Run 500", price: "$14.90", category: "top", colour: "pink", fitLine: "women" }),
  decathlon("women-s-hiking-t-shirt-nh500-green-quechua-8974291", "p3069128/k$90ba5d90b1699af87a341eaf9b4d7417", { name: "Women's Hiking T-Shirt NH500", price: "$12.90", category: "top", colour: "green", fitLine: "women", styles: ["outdoor", "casual"] }),
  decathlon("women-s-hiking-tank-top-nh500-quechua-8554433", "p2643911/k$b809763e546522c71598071d3e33b988", { name: "Women's Hiking Tank Top NH500", price: "$4.90", category: "top", colour: "neutral", fitLine: "women", styles: ["outdoor", "casual"] }),
  decathlon("women-s-short-running-breathable-tank-top-kiprun-run-500-green-kiprun-8903229", "p2789193/k$297677b5a9e19908da53a17c7398669f", { name: "Women's Breathable Running Tank Top Run 500", price: "$9.90", category: "top", colour: "green", fitLine: "women" }),
  decathlon("women-s-v-neck-t-shirt-coolmax-white-decathlon-8956408", "p3074820/k$c194cfc45cf3a1f0c901bf0f0145e2cd", { name: "Women's Coolmax V-Neck T-Shirt", price: "$11.90", category: "top", colour: "white", fitLine: "women", styles: ["casual", "sporty"] }),
  decathlon("women-s-lightweight-running-top-kiprun-run-900-purple-kiprun-8968845", "p3090231/k$475daa5a29bec29e77279d6ead494841", { name: "Women's Lightweight Running Top Run 900", price: "$24.90", category: "top", colour: "purple", fitLine: "women" }),
  decathlon("women-s-surfing-long-sleeve-uv-protection-t-shirt-kanika-white-and-floral-decathlon-8916544", "p2858249/k$9d7786bb3c83c684cc3493f8c54eaa62", { name: "Women's UV-Protection Surfing T-Shirt", price: "$14.90", category: "top", colour: "white", fitLine: "women", styles: ["sporty", "outdoor"] }),
  decathlon("women-s-breathable-sports-leggings-with-phone-pocket-black-domyos-8614959", "p2731572/k$5d70205113d06ffd8853f8b3b3609bba", { name: "Women's Breathable Sports Leggings", price: "$16.90", category: "bottom", colour: "black", fitLine: "women" }),
  decathlon("men-s-mh500-short-sleeved-hiking-t-shirt-quechua-8758003", "p2644008/k$e7385b9ce15aaf4299b6e58de69c8421", { name: "Men's MH500 Hiking T-Shirt", price: "$14.90", category: "top", colour: "neutral", fitLine: "men", styles: ["outdoor", "casual"] }),
  decathlon("men-s-running-breathable-t-shirt-run-500-dry-orange-kiprun-8773016", "p2788849/k$93cbfb0371716069ce3eb0eb4f07fc23", { name: "Men's Breathable Running T-Shirt Run 500", price: "$14.90", category: "top", colour: "orange", fitLine: "men" }),
  decathlon("men-s-surfing-long-sleeved-uv-protection-top-t-shirt-100-grey-olaian-8611954", "p2321850/k$c4188ee0ca61048fd2b08b0512d63b62", { name: "Men's UV-Protection Surfing T-Shirt 100", price: "$11.90", category: "top", colour: "grey", fitLine: "men", styles: ["sporty", "outdoor"] }),
  decathlon("men-s-short-sleeved-crew-neck-fitness-t-shirt-light-blue-domyos-8940643", "p2826748/k$08e78b9306ca58f69fcb9debc98c9f62", { name: "Men's Crew-Neck Fitness T-Shirt", price: "$9.90", category: "top", colour: "light blue", fitLine: "men" }),
  decathlon("men-s-water-repellent-trekking-pants-mt500-orange-simond-8853735", "p2906401/k$faf0ec013b488a1295803ebae9330cb9", { name: "Men's Water-Repellent Trekking Pants MT500", price: "$49.90", category: "bottom", colour: "orange", fitLine: "men", styles: ["outdoor", "utility"], weatherTags: ["hot_humid", "rain"] }),
  decathlon("women-s-fitness-long-sleeved-cropped-t-shirt-black-domyos-8800189", "p2731598/k$7586ee6b83d2e310b96be215f6285d70", { name: "Women's Cropped Long-Sleeved Fitness T-Shirt", price: "$12.90", category: "top", colour: "black", fitLine: "women" }),
  decathlon("women-s-yoga-tank-top-silk-brown-kimjaly-8917515", "p2841407/k$f5b00a335885269511b20987b1a7b1af", { name: "Women's Yoga Tank Top", price: "$12.90", category: "top", colour: "brown", fitLine: "women" }),
  decathlon("women-s-flared-cotton-fitness-leggings-ultra-black-domyos-8801499", "p2730827/k$e69f5506fc95f095662e75b502bfd77e", { name: "Women's Flared Cotton Fitness Leggings", price: "$16.90", category: "bottom", colour: "black", fitLine: "women" }),
  decathlon("women-tennis-skirt-dry-500-navy-kuikma-8547384", "p2834502/k$9b377b3fab6b24f90d8e2315609fdd89", { name: "Women's Tennis Skirt Dry 500", price: "$18.90", category: "bottom", colour: "navy", fitLine: "women" }),
  decathlon("women-s-fitness-leggings-520-neon-purple-domyos-8738143", "p2403725/k$540bb0b32a26d05f0efbfe49814f6819", { name: "Women's Fitness Leggings 520", price: "$28.00", category: "bottom", colour: "purple", fitLine: "women" }),
  decathlon("men-s-road-cycling-shorts-rcr-r-5-black-van-rysel-8969603", "p3043223/k$4140c9f5c953c033f539ba057e40434c", { name: "Men's Road Cycling Shorts RCR-R 5", price: "$79.90", category: "bottom", colour: "black", fitLine: "men" }),
  decathlon("men-s-short-sleeve-anti-uv-surf-t-shirt-loose-fit-green-decathlon-8976545", "p3067533/k$6d322ecfee7e94acca8f3551ec00619b", { name: "Men's Loose-Fit Anti-UV Surf T-Shirt", price: "$9.90", category: "top", colour: "green", fitLine: "men", styles: ["sporty", "outdoor"] }),
  decathlon("women-s-close-fitting-fitness-biker-shorts-terracotta-decathlon-8967787", "p2918418/k$f5f7639a8bc568920688f1b8be809392", { name: "Women's Close-Fitting Fitness Biker Shorts", price: "$19.90", category: "bottom", colour: "terracotta", fitLine: "women" }),
];

export type WardrobeForRetrieval = {
  category: string;
  primary_colour: string | null;
  weather_tags: string[];
};

export type ProfileForRetrieval = {
  preferred_styles?: string[] | null;
  preferred_colours?: string[] | null;
  disliked_colours?: string[] | null;
};

const normal = (value: string) => value.trim().toLowerCase().replaceAll("_", " ");

export function retrieveExploreCandidates(
  wardrobe: WardrobeForRetrieval[],
  profile: ProfileForRetrieval | null,
  limit = 16,
) {
  const categoryCounts = new Map<string, number>();
  const colourCounts = new Map<string, number>();
  for (const item of wardrobe) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
    if (item.primary_colour) {
      const colour = normal(item.primary_colour);
      colourCounts.set(colour, (colourCounts.get(colour) ?? 0) + 1);
    }
  }

  const preferredStyles = new Set((profile?.preferred_styles ?? []).map(normal));
  const preferredColours = new Set((profile?.preferred_colours ?? []).map(normal));
  const dislikedColours = new Set((profile?.disliked_colours ?? []).map(normal));

  const ranked = EXPLORE_CATALOGUE.map((product, index) => {
    const colour = normal(product.colour);
    let score = 0;
    score += Math.max(0, 4 - (categoryCounts.get(product.category) ?? 0)) * 2;
    score += product.weatherTags.includes("hot_humid") ? 2 : 0;
    score += product.weatherTags.includes("rain") ? 0.75 : 0;
    score += preferredColours.has(colour) ? 3 : 0;
    score += product.styles.some((style) => preferredStyles.has(normal(style))) ? 2 : 0;
    score -= (colourCounts.get(colour) ?? 0) * 0.4;
    score -= dislikedColours.has(colour) ? 20 : 0;
    return { product, score, index };
  })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const target = Math.max(10, Math.min(limit, EXPLORE_CATALOGUE.length));
  const selected: typeof ranked = [];
  const selectedIds = new Set<string>();
  const retailerCounts = new Map<string, number>();

  // Give the ranking model at least one strong candidate from every retailer.
  // Otherwise equal scores favour whichever retailer appears first in the
  // static catalogue and the larger source can crowd out the smaller ones.
  for (const retailer of new Set(EXPLORE_CATALOGUE.map((product) => product.retailer))) {
    const candidate = ranked.find(({ product }) => product.retailer === retailer);
    if (!candidate) continue;
    selected.push(candidate);
    selectedIds.add(candidate.product.id);
    retailerCounts.set(retailer, 1);
  }

  const maximumPerRetailer = Math.ceil(target / 2);
  for (const candidate of ranked) {
    if (selected.length === target) break;
    if (selectedIds.has(candidate.product.id)) continue;
    const retailerCount = retailerCounts.get(candidate.product.retailer) ?? 0;
    if (retailerCount >= maximumPerRetailer) continue;
    selected.push(candidate);
    selectedIds.add(candidate.product.id);
    retailerCounts.set(candidate.product.retailer, retailerCount + 1);
  }

  // This only matters if a future catalogue has fewer products per retailer
  // than the cap allows. Keep the requested candidate count stable.
  for (const candidate of ranked) {
    if (selected.length === target) break;
    if (selectedIds.has(candidate.product.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.product.id);
  }

  return selected.map(({ product, score }) => ({ product, score }));
}
