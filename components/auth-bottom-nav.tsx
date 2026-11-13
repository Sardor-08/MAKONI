import Link from 'next/link'
import { House, MapPin, Plus, Search, UserRound } from 'lucide-react'

type AuthBottomNavProps = {
  mode: 'sign-in' | 'sign-up'
}

const items = [
  { label: 'Asosiy', href: '/makoni.html', icon: House },
  { label: 'Izlash', href: '/makoni.html#listings', icon: Search },
  { label: 'Hududlar', href: '/makoni.html#regions', icon: MapPin },
  { label: 'E’lon', href: '/list-property', icon: Plus },
]

export function AuthBottomNav({ mode }: AuthBottomNavProps) {
  const profileHref = mode === 'sign-in' ? '/sign-in' : '/sign-up'

  return (
    <nav className="auth-bottom-nav" aria-label="Mobil navigatsiya">
      {items.map(({ label, href, icon: Icon }) => (
        <Link className="auth-bottom-nav-link" href={href} key={label}>
          <Icon size={19} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
      <Link className="auth-bottom-nav-link" href={profileHref} aria-current="page">
        <UserRound size={19} aria-hidden="true" />
        <span>Profil</span>
      </Link>
    </nav>
  )
}
