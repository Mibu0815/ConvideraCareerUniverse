'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Rocket, Target, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';

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
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-60 -left-40 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-20 right-1/4 w-[300px] h-[300px] bg-brand-gray-200/30 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Convidera Logo Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-black shadow-2xl mb-6">
                <span className="text-3xl font-bold text-brand-white">C</span>
              </div>
              <p className="text-sm font-medium text-brand-gray-500 tracking-widest uppercase">
                Convidera
              </p>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-6xl md:text-8xl font-black text-brand-gray-900 mb-8 tracking-tight leading-none"
            >
              Next-Gen
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-brand-gray-900 via-brand-gray-700 to-brand-gray-900 bg-clip-text text-transparent">
                  Career Pathing
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute bottom-2 md:bottom-4 left-0 right-0 h-4 md:h-6 bg-brand-accent/20 -z-10 origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl text-brand-gray-600 mb-16 max-w-2xl mx-auto leading-relaxed"
            >
              Visualize skill gaps. Get AI-powered recommendations.{' '}
              <span className="text-brand-gray-900 font-semibold">Accelerate your growth.</span>
            </motion.p>

            {/* Animated CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/my-career/compare">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-brand-black text-brand-white rounded-2xl font-semibold text-lg shadow-2xl overflow-hidden"
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-brand-accent via-purple-600 to-brand-accent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ opacity: 0.3 }}
                  />

                  {/* Button content */}
                  <span className="relative z-10 flex items-center gap-3">
                    <Rocket className="w-5 h-5" />
                    Launch Dashboard
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </span>

                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-brand-accent/20 blur-xl group-hover:bg-brand-accent/40 transition-all duration-300 -z-10" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-20 flex flex-wrap justify-center gap-12 text-center"
            >
              {[
                { value: '50+', label: 'Soft Skills' },
                { value: '100+', label: 'Hard Skills' },
                { value: 'AI', label: 'Powered Insights' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-brand-gray-900">{stat.value}</div>
                  <div className="text-sm text-brand-gray-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-brand-gray-300 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-brand-gray-400"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-brand-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-brand-gray-600 max-w-2xl mx-auto">
              Powerful tools to analyze skills, compare roles, and plan your career trajectory.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bento-card p-8 hover:shadow-xl transition-all cursor-pointer"
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 bg-brand-gray-100 rounded-2xl flex items-center justify-center mb-6"
                >
                  <feature.icon className="w-7 h-7 text-brand-gray-700" />
                </motion.div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-brand-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-gray-900 via-brand-gray-800 to-brand-black p-12 md:p-20"
          >
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold text-white mb-6"
              >
                Ready to explore your potential?
              </motion.h2>
              <p className="text-xl text-brand-gray-400 mb-10">
                Select your current role and target position to see a detailed competence comparison.
              </p>
              <Link href="/my-career/compare">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white text-brand-gray-900 rounded-2xl font-semibold text-lg hover:bg-brand-gray-100 transition-colors shadow-2xl"
                >
                  Start Comparing
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-brand-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-black flex items-center justify-center">
                <span className="text-lg font-bold text-brand-white">C</span>
              </div>
              <span className="font-semibold text-brand-gray-700">Career Universe 2.0</span>
            </div>
            <p className="text-sm text-brand-gray-500">
              Convidera GmbH - Built with Next.js, Prisma & AI
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
