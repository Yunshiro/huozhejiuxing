import type { LocationDef } from './schema';

export const LOCATIONS: LocationDef[] = [
  { id: 'room', name: '出租屋', flavor: '六楼，没电梯。窗对着别人的空调外机。' },
  { id: 'site', name: '工地', flavor: '钢筋、灰和中午的太阳，按趟算钱。' },
  { id: 'street', name: '街道', flavor: '电动车比人先到。招牌亮着，人各赶各的。' },
  { id: 'shop', name: '便利店', flavor: '灯管白得发虚，关东煮在格子里慢慢转。' },
  { id: 'eatery', name: '吃的地方', flavor: '油烟味先到，菜单后到。' },
];

export function locationById(id: string): LocationDef {
  return LOCATIONS.find((item) => item.id === id) ?? LOCATIONS[0]!;
}
