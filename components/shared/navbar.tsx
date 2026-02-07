'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SmartHire</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
            >
              Pricing
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            <Link
              href="#features"
              className="block py-2 text-sm font-medium text-gray-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block py-2 text-sm font-medium text-gray-600"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="block py-2 text-sm font-medium text-gray-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
