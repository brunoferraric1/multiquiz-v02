'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type SidebarCardProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  withActionPadding?: boolean;
  isDragging?: boolean;
};

const baseCardClasses =
  'w-full rounded-2xl border border-border bg-muted/60 px-4 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

const hoverCardClasses =
  'hover:border-primary hover:bg-card/80 hover:-translate-y-[1px]';

export const SidebarCard = React.forwardRef<HTMLButtonElement, SidebarCardProps>(
  (
    { className, withActionPadding = false, isDragging = false, type = 'button', ...props },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        baseCardClasses,
        hoverCardClasses,
        withActionPadding && 'pr-14',
        isDragging && 'opacity-60',
        className
      )}
      {...props}
    />
  )
);
SidebarCard.displayName = 'SidebarCard';

export const SidebarCardActionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-muted-foreground transition-colors duration-150',
      'hover:bg-secondary/60 hover:text-foreground focus-visible:bg-secondary/60 focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
SidebarCardActionTrigger.displayName = 'SidebarCardActionTrigger';

type SidebarCardDragHandleProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isDragging?: boolean;
};

export const SidebarCardDragHandle = React.forwardRef<
  HTMLButtonElement,
  SidebarCardDragHandleProps
>(({ className, isDragging = false, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150',
      'hover:text-foreground hover:bg-muted/80 hover:scale-110',
      'focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      isDragging ? 'cursor-grabbing text-foreground scale-110' : 'cursor-grab',
      className
    )}
    {...props}
  />
));
SidebarCardDragHandle.displayName = 'SidebarCardDragHandle';
