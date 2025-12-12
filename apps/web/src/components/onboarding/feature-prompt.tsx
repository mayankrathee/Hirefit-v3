'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface FeaturePromptProps {
  id: string;
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  onDismiss: (featureId: string) => void;
  onAction?: (featureId: string) => void;
}

export function FeaturePrompt({
  id,
  title,
  description,
  actionUrl,
  actionLabel = 'Try it now',
  onDismiss,
  onAction,
}: FeaturePromptProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 200);
  };

  const handleAction = () => {
    onAction?.(id);
    if (actionUrl) {
      router.push(actionUrl);
    }
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="relative bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-xl border border-primary/20 p-4 shadow-lg"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 pr-6">
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{description}</p>

              <Button size="sm" onClick={handleAction} className="h-8">
                {actionLabel}
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FeaturePromptsContainerProps {
  prompts: Array<{
    id: string;
    title: string;
    description: string;
    actionUrl?: string;
  }>;
  onDismiss: (featureId: string) => void;
  onAction?: (featureId: string) => void;
}

export function FeaturePromptsContainer({
  prompts,
  onDismiss,
  onAction,
}: FeaturePromptsContainerProps) {
  if (prompts.length === 0) return null;

  // Only show one prompt at a time
  const currentPrompt = prompts[0];

  return (
    <div className="fixed bottom-4 right-4 w-80 z-40">
      <FeaturePrompt
        key={currentPrompt.id}
        {...currentPrompt}
        onDismiss={onDismiss}
        onAction={onAction}
      />
    </div>
  );
}

