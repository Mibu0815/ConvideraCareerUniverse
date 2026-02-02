'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Target, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Role Comparison',
    description: 'Compare any two roles and see exactly what skills you need to bridge the gap.',
  },
  {
    icon: BarChart3,
    title: 'Skill Analysis',
    description: 'Visualize competence levels across fields with interactive radar charts.',
  },
  {
    icon: TrendingUp,
    title: 'Career Paths',
    description: 'Discover progression opportunities from Junior to Senior levels.',
  },
  {
    icon: Sparkles,
    title: 'AI Mentor',
    description: 'Get personalized recommendations powered by AI to accelerate your growth.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-gray-50 via-white to-brand-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-20 w-60 h-60 bg-brand-gray-200/50 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gray-100 rounded-full text-sm text-brand-gray-600 mb-8"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Convidera Career Development Platform
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-brand-gray-900 mb-6 tracking-tight">
              Career
              <span className="relative inline-block mx-3">
                <span className="relative z-10">Universe</span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="absolute bottom-2 left-0 h-3 bg-brand-accent/20 -z-10"
                />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-brand-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover your path. Bridge the gap.{' '}
              <span className="text-brand-gray-900 font-medium">Grow your career.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/my-career/compare"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-black text-brand-white rounded-2xl font-medium hover:bg-brand-gray-800 transition-all shadow-bento hover:shadow-lg hover:-translate-y-0.5"
              >
                Start Comparing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/my-career/compare"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-gray-700 rounded-2xl font-medium border border-brand-gray-200 hover:border-brand-gray-300 hover:bg-brand-gray-50 transition-all"
              >
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900 mb-4">
              Everything you need to grow
            </h2>
            <p className="text-lg text-brand-gray-600 max-w-2xl mx-auto">
              Powerful tools to analyze skills, compare roles, and plan your career trajectory.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bento-card p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-brand-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-gray-700" />
                </div>
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-brand-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-gray-900 to-brand-gray-800 p-8 md:p-12"
          >
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to explore your potential?
              </h2>
              <p className="text-brand-gray-400 mb-8">
                Select your current role and target position to see a detailed competence comparison.
              </p>
              <Link
                href="/my-career/compare"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-gray-900 rounded-2xl font-medium hover:bg-brand-gray-100 transition-colors"
              >
                Open Role Comparison
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-gray-700/50 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-brand-gray-500">
              Career Universe 2.0 - Convidera GmbH
            </p>
            <p className="text-sm text-brand-gray-400">
              Built with Next.js, Prisma & AI
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
