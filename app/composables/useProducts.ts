import type { Product } from '../../types'

export const useProducts = () => {
  const products: Product[] = [
    {
      id: 1,
      name: '프리미엄 실크 블라우스',
      brand: '채블리',
      price: 68000,
      image: '/images/2c2e04fc2f14e9aff3260268b4930296.webp',
      category: 'top',
      tags: ['봄', '여름', '오피스룩'],
      popularity: 4.8
    },
    {
      id: 2,
      name: '플라워 패턴 원피스',
      brand: '러블리',
      price: 85000,
      image: '/images/c71e6a65c0be5656a4253693d3821509.webp',
      category: 'dress',
      tags: ['봄', '여름', '데이트룩'],
      popularity: 4.7
    },
    {
      id: 3,
      name: '레더 미니스커트',
      brand: '스타일리시',
      price: 55000,
      image: '/images/df51ebd7101025fb37a4e622bf9b2e91.webp',
      category: 'bottom',
      tags: ['가을', '겨울', '파티룩'],
      popularity: 4.6
    },
    {
      id: 4,
      name: '캐시미어 니트 가디건',
      brand: '채블리',
      price: 98000,
      image: '/images/61e38519062bcbf514a9e96547158cb0.webp',
      category: 'outer',
      tags: ['가을', '겨울', '데일리룩'],
      popularity: 4.9
    },
    {
      id: 5,
      name: '크롭 데님 자켓',
      brand: '스타일리시',
      price: 75000,
      image: '/images/bdd5b563eb42fb8244ad3efa58cd1b0e.webp',
      category: 'outer',
      tags: ['봄', '가을', '캐주얼'],
      popularity: 4.5
    },
    {
      id: 6,
      name: '플리츠 롱스커트',
      brand: '러블리',
      price: 65000,
      image: '/images/7ad9338c8c3c2caa1ec82db7f002f549.webp',
      category: 'bottom',
      tags: ['봄', '여름', '페미닌'],
      popularity: 4.7
    },
    {
      id: 7,
      name: '퍼프 슬리브 티셔츠',
      brand: '채블리',
      price: 45000,
      image: '/images/1b15de2159e0903bdf618bab7d1a3527.webp',
      category: 'top',
      tags: ['봄', '여름', '데일리룩'],
      popularity: 4.4
    },
    {
      id: 8,
      name: '와이드 슬랙스',
      brand: '스타일리시',
      price: 58000,
      image: '/images/dd3f706dc12e1d53d3d4e6b5d0172f27.webp',
      category: 'bottom',
      tags: ['봄', '가을', '오피스룩'],
      popularity: 4.8
    },
    {
      id: 9,
      name: '셔링 니트 원피스',
      brand: '러블리',
      price: 78000,
      image: '/images/674efce27a161528359baddb69eb576f.webp',
      category: 'dress',
      tags: ['가을', '겨울', '데이트룩'],
      popularity: 4.7
    },
    {
      id: 10,
      name: '오버사이즈 트렌치코트',
      brand: '채블리',
      price: 158000,
      image: '/images/93b0a2b3a29e9e304b80ece96c250ce9.webp',
      category: 'outer',
      tags: ['봄', '가을', '데일리룩'],
      popularity: 4.9
    },
    {
      id: 11,
      name: '실크 블렌드 블라우스',
      brand: '러블리',
      price: 68000,
      image: '/images/21e46e026ec76fdf0620093fbf7d3595.webp',
      category: 'top',
      tags: ['봄', '여름', '오피스룩'],
      popularity: 4.6
    },
    {
      id: 12,
      name: '하이웨이스트 와이드 데님',
      brand: '스타일리시',
      price: 82000,
      image: '/images/f06a787bb953d765a174044ff60970f8.webp',
      category: 'bottom',
      tags: ['봄', '가을', '데일리룩'],
      popularity: 4.8
    }
  ]

  return {
    products
  }
} 