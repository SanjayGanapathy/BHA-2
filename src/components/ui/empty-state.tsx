// src/components/ui/empty-state.tsx
import React from 'react';
import { Button } from './button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
}

export function EmptyState({ Icon, title, description, actionText, actionLink }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-8 bg-background">
      <Icon className="h-16 w-16 text-muted-foreground" />
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {actionText && actionLink && (
        <Button asChild className="mt-4">
          <Link to={actionLink}>{actionText}</Link>
        </Button>
      )}
    </div>
  );
}