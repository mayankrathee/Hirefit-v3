import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">HireFit</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          AI-Powered Hiring Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-in-from-top">
          Hire the Best Talent,{' '}
          <span className="text-gradient">Faster</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-in-from-bottom animation-delay-100">
          HireFit uses AI to screen resumes, evaluate candidates, and streamline your hiring process. 
          Save hours on every hire while making better decisions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-from-bottom animation-delay-200">
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="#demo"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Watch Demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to hire great talent</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          A complete platform for modern talent acquisition teams
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Sparkles,
              title: 'AI Resume Screening',
              description: 'Automatically analyze and score resumes against job requirements',
              color: 'text-blue-500',
              bg: 'bg-blue-500/10',
            },
            {
              icon: BarChart3,
              title: 'Candidate Evaluation',
              description: 'Structured interviews with collaborative scoring and feedback',
              color: 'text-green-500',
              bg: 'bg-green-500/10',
            },
            {
              icon: Shield,
              title: 'Enterprise Security',
              description: 'SOC 2 compliant with SSO, RBAC, and full audit trails',
              color: 'text-purple-500',
              bg: 'bg-purple-500/10',
            },
            {
              icon: Zap,
              title: 'Fast Integration',
              description: 'Connect with your ATS, calendar, and HR systems',
              color: 'text-orange-500',
              bg: 'bg-orange-500/10',
            },
          ].map((feature, i) => (
            <div 
              key={feature.title}
              className="p-6 rounded-xl border bg-card card-hover animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-gradient-primary rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your hiring?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Join thousands of companies using HireFit to find and hire top talent.
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">HireFit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} HireFit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

