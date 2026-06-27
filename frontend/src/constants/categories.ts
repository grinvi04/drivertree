import { BookOpen, Car, ShieldAlert, Wrench, MapPin, FileText } from 'lucide-react'

export const CATEGORIES = [
  {
    id: 'all',
    name: '전체 가이드',
    icon: BookOpen,
    desc: '도로 위의 모든 실생활 노하우',
  },
  {
    id: 'license',
    name: '면허 취득 가이드',
    icon: FileText,
    desc: '학원비 절약 팁부터 취득 절차까지',
  },
  {
    id: 'basics',
    name: '운전 기본기',
    icon: Car,
    desc: '페달 조작, 룸미러 세팅, 주차 공식',
  },
  {
    id: 'rules',
    name: '도로 법규 · 신호',
    icon: MapPin,
    desc: '헷갈리는 비보호 및 실전 매너',
  },
  {
    id: 'management',
    name: '차량 관리 · 생활',
    icon: Wrench,
    desc: '셀프 주유, 자동 세차, 주기적 소모품',
  },
  {
    id: 'accidents',
    name: '사고 · 이슈 대처',
    icon: ShieldAlert,
    desc: '접촉사고 5단계 절차 및 과태료 대처',
  },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']
