'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, ArrowLeftRight, Bell } from 'lucide-react';

interface BottomNavProps {
  notificariNecitite?: number;
}

export default function BottomNav({ notificariNecitite = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: '/', label: 'Tura mea', icon: Calendar },
    { href: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { href: '/notificari', label: 'Notificări', icon: Bell, badge: notificariNecitite },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e]/95 backdrop-blur-lg border-t border-white/[0.08] flex z-40">
      {items.map(item => {
        const activ = pathname === item.href;
        const Icon = item.icon;
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
          >
            <div className="relative">
              <Icon size={21} className={activ ? 'text-[#60cdff]' : 'text-zinc-500'} strokeWidth={activ ? 2.3 : 2} />
              {!!item.badge && (
                <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
            <span className={`text-[10px] font-medium ${activ ? 'text-[#60cdff]' : 'text-zinc-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
