import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Hexagon, CheckCircle2, Users, Clock, ArrowRight, Zap, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const handleLogin = () => base44.auth.redirectToLogin();

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Hexagon className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">TestHive</span>
        </div>
        <Button onClick={handleLogin} size="sm">
          Sign in <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            Built for Android developers
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Pass Google Play's{' '}
            <span className="text-primary">14-day closed test</span>{' '}
            — together
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            TestHive is a cooperative platform where Android developers test each other's apps, 
            meeting the 12 testers × 14 days requirement to publish on Google Play.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleLogin} size="lg" className="px-8 text-base">
              Get started free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works ↓
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-6 grid grid-cols-3 gap-6 text-center">
          {[
            { value: '12', label: 'Testers required' },
            { value: '14', label: 'Days to complete' },
            { value: '3', label: 'Tests to earn an upload' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">How TestHive works</h2>
          <p className="text-muted-foreground mt-2">A simple credit-based system built on reciprocity</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              step: '01',
              title: 'Test other apps',
              desc: 'Browse apps that need testers. Enroll, verify via Google Play screenshot, and test for 14 days.',
            },
            {
              icon: Star,
              step: '02',
              title: 'Earn credits',
              desc: 'Each completed 14-day test earns you a credit. Collect 3 credits to unlock your own upload slot.',
            },
            {
              icon: CheckCircle2,
              step: '03',
              title: 'Upload your app',
              desc: 'Submit your app and the community rallies to get you your 12 testers for 14 days.',
            },
          ].map(item => (
            <div key={item.step} className="bg-card rounded-2xl border border-border p-6 relative">
              <span className="absolute top-4 right-4 text-4xl font-extrabold text-border">{item.step}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Fair, verified, and trustworthy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every tester must verify enrollment with a real Google Play screenshot. 
                Our AI checks the confirmation before crediting participation — no cheating.
              </p>
              <ul className="space-y-3">
                {[
                  'AI-powered screenshot verification',
                  'Minimum tester protection (no app left understaffed)',
                  'Credit system ensures everyone contributes',
                  'Bootstrap period for early adopters',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">Verified enrollment</p>
                  <p className="text-xs text-muted-foreground">Screenshot OCR + app name check</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">14-day tracking</p>
                  <p className="text-xs text-muted-foreground">Automatic progress monitoring</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">12 testers minimum</p>
                  <p className="text-xs text-muted-foreground">Google Play requirement enforced</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          Ready to launch your app?
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Join TestHive and get the testers you need — while helping others do the same.
        </p>
        <Button onClick={handleLogin} size="lg" className="px-10 text-base">
          Join TestHive <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 md:px-12 py-6 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Hexagon className="w-4 h-4 text-primary" />
          <span className="font-semibold">TestHive</span>
        </div>
        <p>Built for Android developers, by Android developers</p>
      </footer>
    </div>
  );
}