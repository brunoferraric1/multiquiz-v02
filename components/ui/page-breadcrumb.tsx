'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string // If undefined, renders as current page (no link)
}

export interface PageBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * PageBreadcrumb - A reusable breadcrumb component for consistent navigation
 *
 * @example
 * <PageBreadcrumb
 *   items={[
 *     { label: "Configurações", href: "/dashboard/settings" },
 *     { label: "Temas" }  // Current page, no href
 *   ]}
 * />
 */
export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isLink = !!item.href && !isLast

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight
                  className="mx-1 h-4 w-4 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
              {isLink ? (
                <Link
                  href={item.href!}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-foreground"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
