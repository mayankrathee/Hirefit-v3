'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  actionUrl?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to HireFit! 🎉',
    description: 'Your AI-powered hiring platform is ready. Let\'s get you set up in just a few steps.',
    icon: <Sparkles className="w-8 h-8 text-primary" />,
  },
  {
    id: 'create_job',
    title: 'Create Your First Job',
    description: 'Start by creating a job posting. Define the role, requirements, and what you\'re looking for.',
    icon: <span className="text-3xl">📋</span>,
    actionLabel: 'Create Job',
    actionUrl: '/dashboard/jobs/new',
  },
  {
    id: 'upload_resume',
    title: 'Upload Resumes',
    description: 'Upload candidate resumes and let AI analyze them against your job requirements.',
    icon: <span className="text-3xl">📄</span>,
    actionLabel: 'Go to Jobs',
    actionUrl: '/dashboard/jobs',
  },
  {
    id: 'review_scores',
    title: 'Review AI Scores',
    description: 'See how candidates stack up. AI scores each resume on skills, experience, and overall fit.',
    icon: <span className="text-3xl">🎯</span>,
  },
  {
    id: 'done',
    title: 'You\'re All Set!',
    description: 'You\'re ready to streamline your hiring process. Need help? Check our documentation.',
    icon: <span className="text-3xl">🚀</span>,
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export function OnboardingTour({ onComplete, onDismiss }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleAction = () => {
    if (step.actionUrl) {
      router.push(step.actionUrl);
      handleNext();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      {step.icon}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-3">{step.title}</h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-8">{step.description}</p>

                    {/* Action button (if any) */}
                    {step.actionLabel && (
                      <Button
                        onClick={handleAction}
                        variant="outline"
                        className="mb-6"
                      >
                        {step.actionLabel}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Step indicators */}
                <div className="flex justify-center gap-2 mb-6">
                  {ONBOARDING_STEPS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-primary w-6'
                          : index < currentStep
                          ? 'bg-primary/50'
                          : 'bg-muted'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={isFirstStep}
                    className={isFirstStep ? 'invisible' : ''}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button onClick={handleNext}>
                    {isLastStep ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Skip link */}
                <p className="text-center mt-4">
                  <button
                    onClick={handleDismiss}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip tutorial
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

