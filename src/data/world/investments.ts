/** A business you can put money into: it pays gold for every day you are away, collected in its town. */
export interface InvestmentDef {
  id: string;
  town: string;
  name: string;
  description: string;
  /** Gold to build or raise each level. */
  costs: [number, number, number];
  /** Gold per day at each level. */
  income: [number, number, number];
}

export const INVESTMENTS: InvestmentDef[] = [
  { id: 'brightwater-mill', town: 'brightwater', name: 'Riverside Mill', description: 'Grain, flour and a steady trickle of coin.', costs: [800, 2400, 7000], income: [18, 50, 130] },
  { id: 'brightwater-press', town: 'brightwater', name: 'The Brightwater Press', description: 'Pamphlets, almanacs and the odd scandal.', costs: [1000, 3000, 8500], income: [22, 62, 160] },
  { id: 'thornwick-sawmill', town: 'thornwick', name: 'Thornwick Sawmill', description: 'Planks for half the Whisperwood’s doors.', costs: [900, 2600, 7500], income: [20, 55, 140] },
  { id: 'thornwick-apiary', town: 'thornwick', name: 'The Great Apiary', description: 'Honey, wax and a mild sense of dread.', costs: [800, 2400, 7000], income: [18, 50, 130] },
  { id: 'sandhaven-caravanserai', town: 'sandhaven', name: 'Caravanserai Stake', description: 'A share of every caravan that stops for water.', costs: [1200, 3600, 10000], income: [28, 76, 190] },
  { id: 'sandhaven-glassworks', town: 'sandhaven', name: 'Dune Glassworks', description: 'Sand, heat and surprisingly fine bottles.', costs: [1100, 3300, 9500], income: [26, 70, 180] },
  { id: 'frosthold-scriptorium', town: 'frosthold', name: 'The Scriptorium', description: 'Copies of copies, in an excellent hand.', costs: [1300, 3900, 11000], income: [30, 82, 205] },
  { id: 'frosthold-furriery', town: 'frosthold', name: 'Frosthold Furriery', description: 'Warm things for a cold town.', costs: [1200, 3600, 10000], income: [28, 76, 190] },
  { id: 'saltmere-cannery', town: 'saltmere', name: 'Saltmere Cannery', description: 'Fish, in tins, forever.', costs: [1400, 4200, 12000], income: [32, 88, 220] },
  { id: 'saltmere-lighthouse', town: 'saltmere', name: 'The Lighthouse Fee', description: 'A penny for every hull that sees the light.', costs: [1500, 4500, 13000], income: [34, 94, 235] },
];

/** The most days of earnings that wait for you. */
export const INVESTMENT_MAX_DAYS = 30;
