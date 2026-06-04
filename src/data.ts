import { Product, Order } from './types';

export const products: Product[] = [
  {
    id: '1',
    sku: 'DLNZ-JKT-01',
    name: 'Obsidian Shell',
    description: 'Architectural design constructed from 600GSM heavy-weight technical nylon. Features dropped shoulders, a structured boxy fit, and double-layered hood.',
    price: 1250,
    category: 'Outerwear',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbkV5VL-LWyXcnkyCNpxk0L4PNvgCSPhD8uLgMKSAh_mhqOSvSO7u6gr6oR2OG5jW6l6RWxByv9nY_9ieSWDJU22AK8VKVociziDjIqrfFG-wNRPrYs2t1S8HI-HVhgr7nHZAja42TbXwMI_oRnkyy3RWS0WtmFrp-kTFuHscpGaPJlJJa7BlCBIFbsdSqYecXUIPsy0AObRPYg3YGsPCH0yrS7LLkC9nohpz4AJBSYoWk5-Enxx_OQOYqY1J1MZLUyU4XL9bJT1g',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCbkV5VL-LWyXcnkyCNpxk0L4PNvgCSPhD8uLgMKSAh_mhqOSvSO7u6gr6oR2OG5jW6l6RWxByv9nY_9ieSWDJU22AK8VKVociziDjIqrfFG-wNRPrYs2t1S8HI-HVhgr7nHZAja42TbXwMI_oRnkyy3RWS0WtmFrp-kTFuHscpGaPJlJJa7BlCBIFbsdSqYecXUIPsy0AObRPYg3YGsPCH0yrS7LLkC9nohpz4AJBSYoWk5-Enxx_OQOYqY1J1MZLUyU4XL9bJT1g',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdSNdYxdTK9gmemmPBRsZxML42ivL29nEc9NWVEmmScxQgNywb5kZ77WGeM4YO2xxKF7pm_4ZtwzyaZuWmKQhEdyRJlfC2fWrJZ7zURpnbmWNcAcMJbMqawWVgijNqiYr-gqdF2LyIh8xDxyQaOy0Citlpc8ag7J6CMr-qbkTZ-VUOqg1FyPEquWCCf5sEpqgAQilOqpmIYiWBjD6sLqLfBN-xfWiv-vJ7Ri0uuyT5w10GsAQO1oIZkPIr_98bTeLkOPexL7cYvg4'
    ],
    stock: 12,
    featured: true,
    limited: true,
    material: 'Technical Nylon / Silver Hardware',
    colors: ['#000000', '#2A2A2A'],
    details: ['100% Technical Nylon', 'Garment Dyed Obsidian', 'Hand-finished in New Zealand', 'Reinforced Side Seams']
  },
  {
    id: '2',
    sku: 'DLNZ-JKT-02',
    name: 'Titan Boot',
    description: 'High-gloss black leather luxury boots with chunky technical soles. Performance meets modern aesthetic.',
    price: 890,
    category: 'Footwear',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB44Cqa6MIrVvdyc5iCjzH6FRj5ugleUuyrK102kFIY7e93LfZuNRmrc3irmxrsOvOQm_y3Bf3VIOB75Ty-yjFaltWIvlQ7XsoVTNq7k19axQFksl5vrhHqc0rViiI5X_PnHT2UFjbA-qLMThGwjCRKbI6_lPAkJSRYpToAQA0XVQ0e_4nPD5Zga461ADj9gWwbMnyeDaW5lqIzvaPxR3ghCZ9_D6xfJJ94G30l-HWQk8c0tFC75vTlrN2FyvNFvJ_SOcPKcNl1yds',
    stock: 5,
    featured: true,
    material: 'Bonded Leather / Rubber Soles'
  },
  {
    id: '3',
    sku: 'ESS-HOOD-01',
    name: 'Veil Hoodie',
    description: 'Layered technical mask and a black silk hoodie. The ultimate in modern anonymity.',
    price: 550,
    category: 'Tops',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHFNm0EJM0OndWeBprTE0Qt8gGTU-zX7Dt1VeA_OQmRuTvFMRnBEddje0vxHIRhiaajFBza6DHUuB7dcArA0jEs3ydwJf-a6z2UQ1wEvLfSJanOm_Tb8-OouSopiOt4xIl9wUrwc1zFQxTHSjD-gqIALG5tBuBVBCbjh55XP5ZG6u_rDT51rVEDog-Jh5AxCK-P8NZzw2fwpE_xDub4tXqu2I0S4cMvWib7pMSlKR6ugE0YbBOG_F1lLX8B3y_LwiNXM06Ch5Ncrk',
    stock: 20,
    featured: true,
    material: 'Silk / Cotton Blend'
  },
  {
    id: '4',
    sku: 'DLNZ-JKT-03',
    name: 'MA-1 Technical',
    description: 'Structured minimal black bomber jacket with silver zipper accents.',
    price: 2100,
    category: 'Outerwear',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRM1NA-_fvS-3bo-vMmEG_PpZZJpkmsKOlRLQ_mkg3tW4wfDYz6C6fIBCX97y1-LwXk92z3tqbYbhL-eDqqrYzhn-ne5jWlJgl4UIP2TCGM22gZXQBQ0oEGsVSukqbcxpXrYGvczLcu-lpNQ06eJsCFFmp24Saf0UskmcssADy14JU2bhRzTfEOCEU_hUpA4OpocSggPeKA5_Y2Sm60khmGBHvipCxiNmxu7nwywocV_NDlVq-oBYtJPg8J54m8f10yLNpRIVABmg',
    stock: 0,
    limited: true
  },
  {
    id: '5',
    sku: 'DLNZ-TRS-09',
    name: 'Linear Pant',
    description: 'Charcoal grey tailored trousers with unique architectural seam detailing.',
    price: 780,
    category: 'Trousers',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Wk2iCMPtlvSZMcVZCD3Th-q1uMG6Rpgax3R1RMhWCsp5A4dwQPiTCdbF5L9bicPeAmzC4BFOxXtVw-4FyfFC12AjCZ_P-7XfKhssqF9zf_XsIYtrKkXFNilNfAgsLC9qqoyzfiarsksetCDyanfhsdd27YnpfGhAe12UuquPN_J0u4ufb09XI_RXkDEjyJHJ_IT903UlMnIC05XXnQvhYupI9RcBP4y20riPAu63bm3lr2GJ-ICm-r47Qu9cZDUh2xBNfMDG6fA',
    stock: 8,
    limited: true
  },
  {
    id: '6',
    sku: 'ESS-TEE-00',
    name: 'Heavy Tee',
    description: 'Premium heavyweight white cotton t-shirt with a subtle debossed black logo.',
    price: 320,
    category: 'Tops',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-I6847TUgffMu_49XMQVMaKZ3WZStoPE2eN1L_kxgtEWAY-n7B8n3CXKyLJfmhIS23kSXtRD0s6EXQLGv-mNf3MXR4hqRT5Nm8m3LbVsr3qzBosvYSwPrHGBsUv4UlMtA868pqCsVAzKWw6TDBCxKtAGjKPqfHkDbdd3r2ef4Ol9vmgizBbWIhUJq0FjCu1wjyO1ReHE-sNfaymcUmPipI4EtGGFesJHsoBs2ENh5OLqS6U-e5vuGo1OcOOaUvrnfkgBJSrelCVs',
    stock: 42
  },
  {
    id: '7',
    sku: 'DLNZ-VST-01',
    name: 'Utility Vest',
    description: 'Minimalist black technical vest with multiple hidden pockets and silver hardware.',
    price: 940,
    category: 'Outerwear',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDX4k8OEnKG3bZ4Z7YQFj_2vdDg1dkCGDmWIlRH8q1iZEy7IAvwoKYDcyMw8pmhvlrrssdCV8z-vu7lmPDkujMAlsvWfiHYTAxs1q5QScK6vN4J15hoscUhW4FoW7-4bM7aWeBrn_oh-SQChisOje2TLX5XI_eeGte43bd4Viy1en0hq3SUb6hFP4viI-oLm7c2NNk2rRfXwsgU5CPJy7SkssU6oQHNO4UCCgz5QgmpWYsDoQWEqWjK8Ul3zYtrTx3kwxa2yqpmyRo',
    stock: 3
  }
];

export const orders: Order[] = [
  {
    id: 'DLNZ-9921',
    customerName: 'Alexander V.',
    customerEmail: 'alex.v@example.com',
    date: 'Oct 12, 2023',
    amount: 2440.00,
    status: 'Processing'
  },
  {
    id: 'DLNZ-9920',
    customerName: 'M. Nakajima',
    customerEmail: 'nakajima@tokyo.jp',
    date: 'Oct 11, 2023',
    amount: 890.00,
    status: 'Shipped',
    tracking: 'UPS: 1Z992A...'
  },
  {
    id: 'DLNZ-9919',
    customerName: 'Julian Thorne',
    customerEmail: 'j.thorne@style.com',
    date: 'Oct 11, 2023',
    amount: 1250.00,
    status: 'Hold'
  }
];
