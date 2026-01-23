-- Seed data: Velhon torni example
-- Real product from Kustannusyhtiö Myrrys

-- Insert Publisher
INSERT INTO publishers (name, slug, description) VALUES (
  'Kustannusyhtiö Myrrys',
  'kustannusyhtio-myrrys',
  'Suomalainen roolipelien ja pelituotteiden kustantaja, joka on erikoistunut laadukkaaseen fantasiamateriaaliin.'
);

-- Insert Creators
INSERT INTO creators (name, slug) VALUES
  ('Jonas Mustonen', 'jonas-mustonen'),
  ('Anssi Vartiainen', 'anssi-vartiainen'),
  ('Jukka Sorsa', 'jukka-sorsa'),
  ('Petri Leinonen', 'petri-leinonen'),
  ('Tia Carolina Ihalainen', 'tia-carolina-ihalainen'),
  ('Arhi Makkonen', 'arhi-makkonen'),
  ('Vehka Kurjenmiekka', 'vehka-kurjenmiekka'),
  ('Tero Mäkelä', 'tero-makela');

-- Insert Product
INSERT INTO products (
  title,
  slug,
  publisher_id,
  product_type,
  year,
  isbn,
  description,
  lang
) VALUES (
  'Velhon torni',
  'velhon-torni',
  (SELECT id FROM publishers WHERE slug = 'kustannusyhtio-myrrys'),
  'Adventure',
  2025,
  'ISBN 978-952-65247-5-7 (pehmeäkantinen), ISBN 978-952-65247-6-4 (PDF)',
  'Seikkailu ensimmäisen tason hahmoille Legendoja & lohikäärmeitä -roolipeliin. Traakinniemen kaupungissa kiertävät huolestuttavat huhut. Ihmisiä on kadonnut, ja kaikki merkit osoittavat kohti läheistä, mystistä tornia, joka kuuluu muinaiselle ja mahtavalle velholle. Velhon torni on valmis seikkailu, joka soveltuu neljälle tai useammalle ensimmäisen tason hahmolle ja syöksee heidät heti alkumetreillä toimintaan ja vaarallisiin tilanteisiin.',
  'fi'
);

-- Link Creators to Product
INSERT INTO products_creators (product_id, creator_id, role) VALUES
  -- Primary designer
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'jonas-mustonen'),
    'Pääsuunnittelija'
  ),
  -- Co-authors/designers
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'anssi-vartiainen'),
    'Kirjoittaja'
  ),
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'jukka-sorsa'),
    'Kirjoittaja'
  ),
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'petri-leinonen'),
    'Kirjoittaja'
  ),
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'vehka-kurjenmiekka'),
    'Kirjoittaja'
  ),
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'tero-makela'),
    'Kirjoittaja'
  ),
  -- Illustrator
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'tia-carolina-ihalainen'),
    'Kuvittaja'
  ),
  -- Cartographer
  (
    (SELECT id FROM products WHERE slug = 'velhon-torni'),
    (SELECT id FROM creators WHERE slug = 'arhi-makkonen'),
    'Kartantekijä'
  );

-- Add a few more example products from the same publisher to demonstrate listings

INSERT INTO products (
  title,
  slug,
  publisher_id,
  product_type,
  year,
  description,
  lang
) VALUES
(
  'Legendoja & lohikäärmeitä: Pelaajan kirja',
  'legendoja-lohikaarmeitä-pelaajan-kirja',
  (SELECT id FROM publishers WHERE slug = 'kustannusyhtio-myrrys'),
  'Core Rulebook',
  2024,
  'Legendoja & lohikäärmeitä on suomalainen fantasiaroolipeli, joka perustuu maailman suosituimpaan roolipelisysteemiin. Pelaajan kirja sisältää kaiken mitä tarvitset oman sankarin luomiseen ja seikkailujen pelaamiseen.',
  'fi'
),
(
  'Legendoja & lohikäärmeitä: Pelinjohtajan kirja',
  'legendoja-lohikaarmeitä-pelinjohtajan-kirja',
  (SELECT id FROM publishers WHERE slug = 'kustannusyhtio-myrrys'),
  'Core Rulebook',
  2024,
  'Pelinjohtajan kirja sisältää kaiken tarvittavan seikkailujen johtamiseen, maailman rakentamiseen ja hirviöiden luomiseen.',
  'fi'
);

-- Link Jonas Mustonen as lead designer for core books too
INSERT INTO products_creators (product_id, creator_id, role) VALUES
  (
    (SELECT id FROM products WHERE slug = 'legendoja-lohikaarmeitä-pelaajan-kirja'),
    (SELECT id FROM creators WHERE slug = 'jonas-mustonen'),
    'Pääsuunnittelija'
  ),
  (
    (SELECT id FROM products WHERE slug = 'legendoja-lohikaarmeitä-pelinjohtajan-kirja'),
    (SELECT id FROM creators WHERE slug = 'jonas-mustonen'),
    'Pääsuunnittelija'
  );
