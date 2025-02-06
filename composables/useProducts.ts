import type { Product } from '../types'

export const products: Product[] = [
  {
    id: 1,
    name: '프리미엄 실크 블라우스',
    brand: '채블리',
    price: 68000,
    image: 'https://image.msscdn.net/images/goods_img/20220311/2410515/2410515_1_500.jpg',
    category: 'top',
    tags: ['봄', '여름', '오피스룩'],
    popularity: 4.8
  },
  {
    id: 2,
    name: '플라워 패턴 원피스',
    brand: '러블리',
    price: 85000,
    image: 'https://image.msscdn.net/images/goods_img/20230309/3129998/3129998_16783248619711_500.jpg',
    category: 'dress',
    tags: ['봄', '여름', '데이트룩'],
    popularity: 4.7
  },
  {
    id: 3,
    name: '레더 미니스커트',
    brand: '스타일리시',
    price: 55000,
    image: 'https://image.msscdn.net/images/goods_img/20230920/3506833/3506833_16951633050925_500.jpg',
    category: 'bottom',
    tags: ['가을', '겨울', '파티룩'],
    popularity: 4.6
  },
  {
    id: 4,
    name: '캐시미어 니트 가디건',
    brand: '채블리',
    price: 98000,
    image: 'https://image.msscdn.net/images/goods_img/20230828/3453961/3453961_16931830886431_500.jpg',
    category: 'outer',
    tags: ['가을', '겨울', '데일리룩'],
    popularity: 4.9
  },
  {
    id: 5,
    name: '크롭 데님 자켓',
    brand: '스타일리시',
    price: 75000,
    image: 'https://image.msscdn.net/images/goods_img/20230222/3106843/3106843_16771022562863_500.jpg',
    category: 'outer',
    tags: ['봄', '가을', '캐주얼'],
    popularity: 4.5
  },
  {
    id: 6,
    name: '플리츠 롱스커트',
    brand: '러블리',
    price: 65000,
    image: 'https://image.msscdn.net/images/goods_img/20230313/3136061/3136061_16786494098946_500.jpg',
    category: 'bottom',
    tags: ['봄', '여름', '페미닌'],
    popularity: 4.7
  },
  {
    id: 7,
    name: '퍼프 슬리브 티셔츠',
    brand: '채블리',
    price: 45000,
    image: 'https://image.msscdn.net/images/goods_img/20230310/3132931/3132931_16784850515276_500.jpg',
    category: 'top',
    tags: ['봄', '여름', '데일리룩'],
    popularity: 4.4
  },
  {
    id: 8,
    name: '와이드 슬랙스',
    brand: '스타일리시',
    price: 58000,
    image: 'https://image.msscdn.net/images/goods_img/20230911/3488827/3488827_16944340741455_500.jpg',
    category: 'bottom',
    tags: ['봄', '가을', '오피스룩'],
    popularity: 4.8
  },
  {
    id: 9,
    name: '셔링 니트 원피스',
    brand: '러블리',
    price: 78000,
    image: 'https://image.msscdn.net/images/goods_img/20230828/3453961/3453961_16931830886431_500.jpg',
    category: 'dress',
    tags: ['가을', '겨울', '데이트룩'],
    popularity: 4.7
  },
  {
    id: 10,
    name: '오버사이즈 트렌치코트',
    brand: '채블리',
    price: 158000,
    image: 'https://image.msscdn.net/images/goods_img/20230828/3453965/3453965_16931831526149_500.jpg',
    category: 'outer',
    tags: ['봄', '가을', '데일리룩'],
    popularity: 4.9
  },
  {
    id: 11,
    name: '실크 블렌드 블라우스',
    brand: '러블리',
    price: 68000,
    image: 'https://image.msscdn.net/images/goods_img/20230313/3136061/3136061_16786494098946_500.jpg',
    category: 'top',
    tags: ['봄', '여름', '오피스룩'],
    popularity: 4.6
  },
  {
    id: 12,
    name: '하이웨이스트 와이드 데님',
    brand: '스타일리시',
    price: 82000,
    image: 'https://image.msscdn.net/images/goods_img/20230911/3488827/3488827_16944340741455_500.jpg',
    category: 'bottom',
    tags: ['봄', '가을', '데일리룩'],
    popularity: 4.8
  }
]

export const useProducts = () => {
  return {
    products
  }
} 