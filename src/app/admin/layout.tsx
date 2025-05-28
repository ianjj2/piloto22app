'use client';

import { Toaster } from 'react-hot-toast'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, Package, Gift, FileText, Home } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: Home,
    },
    {
      title: 'Usuários',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Produtos',
      href: '/admin/products',
      icon: Package,
    },
    {
      title: 'Sorteios',
      href: '/admin/raffles',
      icon: Gift,
    },
    {
      title: 'Posts',
      href: '/admin/posts',
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-[#1a0808] border-r border-red-800/50">
          <div className="p-4">
            <h1 className="text-xl font-bold mb-6 text-red-500">Painel Admin</h1>
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
                      pathname === item.href
                        ? 'bg-red-500/10 text-red-500 border border-red-800/50'
                        : 'text-gray-300 hover:bg-[#2a1010] hover:text-red-400'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  )
} 