export const CITY_LIST: string[] = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京',
  '西安', '重庆', '天津', '苏州', '长沙', '郑州', '青岛', '大连',
  '厦门', '昆明', '贵阳', '合肥', '福州', '济南', '哈尔滨', '沈阳',
  '长春', '石家庄', '太原', '兰州', '西宁', '银川', '乌鲁木齐',
  '南宁', '海口', '三亚', '拉萨', '呼和浩特', '香港', '澳门', '台北',
]

export function filterCities(query: string): string[] {
  if (!query.trim()) return CITY_LIST
  return CITY_LIST.filter(c => c.includes(query.trim()))
}
