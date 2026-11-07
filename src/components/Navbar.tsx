import { useEffect, useState } from 'react'
import { subscribeScroll } from '../lib/scrollFrame'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { to: '/projects', label: 'Projects' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let last = window.scrollY
    return subscribeScroll((y) => {
      setScrolled(y > 24)
      // Tuck the bar away while reading down the page; bring it back on any upward scroll.
      if (Math.abs(y - last) > 6) {
        setHidden(y > 240 && y > last)
        last = y
      }
    })
  }, [])

  return (
    <nav className={`site-nav fixed left-0 right-0 top-0 z-50 ${scrolled ? 'scrolled' : ''} ${hidden && !open ? 'is-hidden' : ''}`}>
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 md:px-10 lg:px-12">
        <Link to="/" className="flex items-center" aria-label="Salitous Homes home">
          <img src="/assets/brand/salitous-logo-transparent.webp" alt="Salitous Homes" className="site-logo" />
        </Link>
        <div className="nav-links hidden items-center gap-9 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)
            return <Link key={link.to} to={link.to} className={`nav-link ${active ? 'active' : ''}`}>{link.label}</Link>
          })}
          <Link to="/contact" className="btn-primary ml-2 px-5 py-3">Get in touch</Link>
        </div>
        <button className="rounded-full border border-black/10 p-2 text-walnut md:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="mobile-menu md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6">
            {navLinks.map((link) => <Link key={link.to} to={link.to} className="nav-link text-base" onClick={() => setOpen(false)}>{link.label}</Link>)}
            <Link to="/contact" className="btn-primary" onClick={() => setOpen(false)}>Get in touch</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
