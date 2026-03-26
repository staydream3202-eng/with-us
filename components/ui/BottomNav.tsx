'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  SparklesIcon,
  CalendarDaysIcon,
  TrophyIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  SparklesIcon as SparklesIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid'

const TABS = [
  { href: '/home',     label: '홈',    Icon: HomeIcon,          IconActive: HomeIconSolid },
  { href: '/planner',  label: '플래너', Icon: SparklesIcon,      IconActive: SparklesIconSolid },
  { href: '/calendar', label: '캘린더', Icon: CalendarDaysIcon,  IconActive: CalendarDaysIconSolid },
  { href: '/vs',       label: 'VS',    Icon: TrophyIcon,        IconActive: TrophyIconSolid },
  { href: '/profile',  label: '정보',  Icon: UserCircleIcon,    IconActive: UserCircleIconSolid },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white">
      <ul className="flex h-14 items-center">
        {TABS.map(({ href, label, Icon, IconActive }) => {
          const active = pathname.startsWith(href)
          const Ic = active ? IconActive : Icon
          return (
            <li key={href} className="flex flex-1 justify-center">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] md:text-xs font-medium transition-colors ${
                  active ? 'text-indigo-500' : 'text-gray-400'
                }`}
              >
                <Ic className="w-5 h-5 md:w-6 md:h-6" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
