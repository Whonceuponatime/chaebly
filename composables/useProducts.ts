import { Product } from '~/types'

export const products: Product[] = [
  {
    id: 1,
    name: '프리미엄 실크 블라우스',
    brand: '채블리',
    price: 68000,
    image: '/images/products/product1.svg',
    category: 'top',
    tags: ['봄', '여름', '오피스룩'],
    popularity: 4.8
  },
  {
    id: 2,
    name: '플라워 패턴 원피스',
    brand: '러블리',
    price: 85000,
    image: '/images/products/product2.svg',
    category: 'dress',
    tags: ['봄', '여름', '데이트룩'],
    popularity: 4.7
  },
  {
    id: 3,
    name: '레더 미니스커트',
    brand: '스타일리시',
    price: 55000,
    image: '/images/products/product3.svg',
    category: 'bottom',
    tags: ['가을', '겨울', '파티룩'],
    popularity: 4.6
  },
  {
    id: 4,
    name: '캐시미어 니트 가디건',
    brand: '채블리',
    price: 98000,
    image: '/images/products/product4.svg',
    category: 'outer',
    tags: ['가을', '겨울', '데일리룩'],
    popularity: 4.9
  },
  {
    id: 5,
    name: '크롭 데님 자켓',
    brand: '스타일리시',
    price: 75000,
    image: '/images/products/product1.svg',
    category: 'outer',
    tags: ['봄', '가을', '캐주얼'],
    popularity: 4.5
  },
  {
    id: 6,
    name: '플리츠 롱스커트',
    brand: '러블리',
    price: 65000,
    image: '/images/products/product2.svg',
    category: 'bottom',
    tags: ['봄', '여름', '페미닌'],
    popularity: 4.7
  },
  {
    id: 7,
    name: '퍼프 슬리브 티셔츠',
    brand: '채블리',
    price: 45000,
    image: '/images/products/product3.svg',
    category: 'top',
    tags: ['봄', '여름', '데일리룩'],
    popularity: 4.4
  },
  {
    id: 8,
    name: '와이드 슬랙스',
    brand: '스타일리시',
    price: 58000,
    image: '/images/products/product4.svg',
    category: 'bottom',
    tags: ['봄', '가을', '오피스룩'],
    popularity: 4.8
  }
]

export const useProducts = () => {
  return {
    products
  }
} 