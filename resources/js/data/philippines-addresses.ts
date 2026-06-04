export type BarangayOption = {
  name: string;
  zip?: string;
};

export type CityOption = {
  name: string;
  zip?: string;
  barangays: BarangayOption[];
};

export type ProvinceOption = {
  name: string;
  cities: CityOption[];
};

export type RegionOption = {
  code: string;
  name: string;
  provinces: ProvinceOption[];
};

export const OTHER_ADDRESS_VALUE = 'Other / Manual Input';

const otherBarangay: BarangayOption = { name: OTHER_ADDRESS_VALUE };

function city(name: string, zip: string, barangays: string[] = []): CityOption {
  return {
    name,
    zip,
    barangays: [
      ...barangays.map((barangay) => ({ name: barangay, zip })),
      otherBarangay,
    ],
  };
}

function province(name: string, cities: CityOption[] = []): ProvinceOption {
  return {
    name,
    cities: cities.length > 0 ? cities : [city(OTHER_ADDRESS_VALUE, '')],
  };
}

export const PHILIPPINES_ADDRESS_OPTIONS: RegionOption[] = [
  {
    code: 'CAR',
    name: 'Cordillera Administrative Region (CAR)',
    provinces: [
      province('Benguet', [
        city('Baguio City', '2600', [
          'Abanao-Zandueta-Kayong-Chugum-Otek',
          'Alfonso Tabora',
          'Ambiong',
          'Andres Bonifacio-Caguioa-Rimando',
          'Asin Road',
          'Atok Trail',
          'Bakakeng Central',
          'Bakakeng Norte/Sur',
          'Bayan Park East',
          'Bayan Park Village',
          'BGH Compound',
          'Brookside',
          'Cabinet Hill-Teacher’s Camp',
          'Camp 7',
          'Camp 8',
          'Camp Allen',
          'City Camp Central',
          'City Camp Proper',
          'Country Club Village',
          'Cresencia Village',
          'Dagsian, Upper',
          'Dontogan',
          'Engineers Hill',
          'Fairview Village',
          'Ferdinand',
          'Fort del Pilar',
          'Gibraltar',
          'Greenwater Village',
          'Happy Hollow',
          'Harrison-Claudio Carantes',
          'Holy Ghost Extension',
          'Holy Ghost Proper',
          'Imelda Village',
          'Irisan',
          'Kabayanihan',
          'Kagitingan',
          'Kayang Extension',
          'Kias',
          'Legarda-Burnham-Kisad',
          'Loakan Proper',
          'Loakan-Apugan',
          'Loakan-Liwanag',
          'Lower Dagsian',
          'Lucnab',
          'Lualhati',
          'Magsaysay Private Road',
          'Malcolm Square-Perfecto',
          'Mines View Park',
          'Modern Site East',
          'New Lucban',
          'North Central Aurora Hill',
          'Outlook Drive',
          'Pacdal',
          'Pinget',
          'Quezon Hill Proper',
          'Quirino Hill East',
          'Rock Quarry Lower',
          'San Luis Village',
          'San Roque Village',
          'Santa Escolastica',
          'Scout Barrio',
          'Session Road Area',
          'South Drive',
          'South Sanitary Camp',
          'Teodora Alonzo',
          'Trancoville',
          'Victoria Village',
        ]),
        city('La Trinidad', '2601', ['Alapang', 'Alno', 'Ambiong', 'Bahong', 'Balili', 'Beckel', 'Betag', 'Bineng', 'Cruz', 'Lubas', 'Pico', 'Poblacion', 'Puguis', 'Shilan', 'Tawang', 'Wangal']),
        city('Itogon', '2604', ['Ampucao', 'Dalupirip', 'Gumatdang', 'Loacan', 'Poblacion', 'Tinongdan', 'Tuding', 'Ucab', 'Virac']),
        city('Tuba', '2603', ['Ansagan', 'Camp 1', 'Camp 2', 'Camp 3', 'Camp 4', 'Nangalisan', 'Poblacion', 'San Pascual', 'Tabaan Norte', 'Tabaan Sur', 'Tadiangan', 'Taloy Norte', 'Taloy Sur', 'Twin Peaks']),
        city('Tublay', '2615'),
        city('Atok', '2612'),
        city('Bakun', '2610'),
        city('Bokod', '2605'),
        city('Buguias', '2607'),
        city('Kabayan', '2606'),
        city('Kapangan', '2613'),
        city('Kibungan', '2611'),
        city('Mankayan', '2608'),
        city('Sablan', '2614'),
      ]),
      province('Abra', [city('Bangued', '2800')]),
      province('Apayao', [city('Kabugao', '3809')]),
      province('Ifugao', [city('Lagawe', '3600'), city('Banaue', '3601')]),
      province('Kalinga', [city('Tabuk City', '3800')]),
      province('Mountain Province', [city('Bontoc', '2616'), city('Sagada', '2619')]),
    ],
  },
  {
    code: 'NCR',
    name: 'National Capital Region (NCR)',
    provinces: [
      province('Metro Manila', [
        city('Manila', '1000'),
        city('Quezon City', '1100'),
        city('Makati', '1200'),
        city('Taguig', '1630'),
        city('Pasig', '1600'),
        city('Mandaluyong', '1550'),
        city('San Juan', '1500'),
        city('Pasay', '1300'),
        city('Parañaque', '1700'),
        city('Las Piñas', '1740'),
        city('Muntinlupa', '1770'),
        city('Caloocan', '1400'),
        city('Malabon', '1470'),
        city('Navotas', '1485'),
        city('Valenzuela', '1440'),
        city('Marikina', '1800'),
        city('Pateros', '1620'),
      ]),
    ],
  },
  {
    code: 'REGION I',
    name: 'Region I - Ilocos Region',
    provinces: [
      province('Ilocos Norte', [city('Laoag City', '2900')]),
      province('Ilocos Sur', [city('Vigan City', '2700')]),
      province('La Union', [city('San Fernando City', '2500')]),
      province('Pangasinan', [city('Dagupan City', '2400'), city('Urdaneta City', '2428'), city('Alaminos City', '2404')]),
    ],
  },
  {
    code: 'REGION II',
    name: 'Region II - Cagayan Valley',
    provinces: [province('Batanes'), province('Cagayan', [city('Tuguegarao City', '3500')]), province('Isabela', [city('Ilagan City', '3300'), city('Santiago City', '3311')]), province('Nueva Vizcaya', [city('Bayombong', '3700')]), province('Quirino')],
  },
  {
    code: 'REGION III',
    name: 'Region III - Central Luzon',
    provinces: [
      province('Aurora', [city('Baler', '3200')]),
      province('Bataan', [city('Balanga City', '2100')]),
      province('Bulacan', [city('Malolos City', '3000')]),
      province('Nueva Ecija', [city('Cabanatuan City', '3100'), city('Palayan City', '3132')]),
      province('Pampanga', [city('City of San Fernando', '2000'), city('Angeles City', '2009')]),
      province('Tarlac', [city('Tarlac City', '2300')]),
      province('Zambales', [city('Olongapo City', '2200')]),
    ],
  },
  {
    code: 'REGION IV-A',
    name: 'Region IV-A - CALABARZON',
    provinces: [province('Batangas', [city('Batangas City', '4200'), city('Lipa City', '4217')]), province('Cavite', [city('Tagaytay City', '4120'), city('Dasmariñas City', '4114')]), province('Laguna', [city('Santa Rosa City', '4026'), city('Los Baños', '4030')]), province('Quezon', [city('Lucena City', '4301')]), province('Rizal', [city('Antipolo City', '1870')])],
  },
  {
    code: 'MIMAROPA',
    name: 'MIMAROPA Region',
    provinces: [province('Marinduque'), province('Occidental Mindoro'), province('Oriental Mindoro', [city('Calapan City', '5200')]), province('Palawan', [city('Puerto Princesa City', '5300')]), province('Romblon')],
  },
  {
    code: 'REGION V',
    name: 'Region V - Bicol Region',
    provinces: [province('Albay', [city('Legazpi City', '4500')]), province('Camarines Norte'), province('Camarines Sur', [city('Naga City', '4400')]), province('Catanduanes'), province('Masbate'), province('Sorsogon', [city('Sorsogon City', '4700')])],
  },
  {
    code: 'REGION VI',
    name: 'Region VI - Western Visayas',
    provinces: [province('Aklan', [city('Kalibo', '5600')]), province('Antique'), province('Capiz', [city('Roxas City', '5800')]), province('Guimaras'), province('Iloilo', [city('Iloilo City', '5000')]), province('Negros Occidental', [city('Bacolod City', '6100')])],
  },
  {
    code: 'REGION VII',
    name: 'Region VII - Central Visayas',
    provinces: [province('Bohol', [city('Tagbilaran City', '6300')]), province('Cebu', [city('Cebu City', '6000'), city('Mandaue City', '6014'), city('Lapu-Lapu City', '6015')]), province('Negros Oriental', [city('Dumaguete City', '6200')]), province('Siquijor')],
  },
  {
    code: 'REGION VIII',
    name: 'Region VIII - Eastern Visayas',
    provinces: [province('Biliran'), province('Eastern Samar'), province('Leyte', [city('Tacloban City', '6500'), city('Ormoc City', '6541')]), province('Northern Samar'), province('Samar'), province('Southern Leyte')],
  },
  {
    code: 'REGION IX',
    name: 'Region IX - Zamboanga Peninsula',
    provinces: [province('Zamboanga del Norte'), province('Zamboanga del Sur', [city('Pagadian City', '7016'), city('Zamboanga City', '7000')]), province('Zamboanga Sibugay')],
  },
  {
    code: 'REGION X',
    name: 'Region X - Northern Mindanao',
    provinces: [province('Bukidnon', [city('Malaybalay City', '8700')]), province('Camiguin'), province('Lanao del Norte', [city('Iligan City', '9200')]), province('Misamis Occidental'), province('Misamis Oriental', [city('Cagayan de Oro City', '9000')])],
  },
  {
    code: 'REGION XI',
    name: 'Region XI - Davao Region',
    provinces: [province('Davao de Oro'), province('Davao del Norte', [city('Tagum City', '8100')]), province('Davao del Sur', [city('Davao City', '8000')]), province('Davao Occidental'), province('Davao Oriental', [city('Mati City', '8200')])],
  },
  {
    code: 'REGION XII',
    name: 'Region XII - SOCCSKSARGEN',
    provinces: [province('Cotabato'), province('Sarangani'), province('South Cotabato', [city('General Santos City', '9500'), city('Koronadal City', '9506')]), province('Sultan Kudarat')],
  },
  {
    code: 'REGION XIII',
    name: 'Region XIII - Caraga',
    provinces: [province('Agusan del Norte', [city('Butuan City', '8600')]), province('Agusan del Sur'), province('Dinagat Islands'), province('Surigao del Norte', [city('Surigao City', '8400')]), province('Surigao del Sur')],
  },
  {
    code: 'BARMM',
    name: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
    provinces: [province('Basilan'), province('Lanao del Sur', [city('Marawi City', '9700')]), province('Maguindanao del Norte'), province('Maguindanao del Sur'), province('Sulu'), province('Tawi-Tawi')],
  },
  {
    code: OTHER_ADDRESS_VALUE,
    name: OTHER_ADDRESS_VALUE,
    provinces: [province(OTHER_ADDRESS_VALUE)],
  },
];

export function regionByCode(code?: string | null): RegionOption {
  return PHILIPPINES_ADDRESS_OPTIONS.find((region) => region.code === code || region.name === code) ?? PHILIPPINES_ADDRESS_OPTIONS[0];
}

export function provinceByName(region: RegionOption, name?: string | null): ProvinceOption {
  return region.provinces.find((provinceOption) => provinceOption.name === name) ?? region.provinces[0];
}

export function cityByName(provinceOption: ProvinceOption, name?: string | null): CityOption {
  return provinceOption.cities.find((cityOption) => cityOption.name === name) ?? provinceOption.cities[0];
}
