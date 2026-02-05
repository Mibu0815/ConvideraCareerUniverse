'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, X, Sparkles } from 'lucide-react';
import { submitFeedback } from '@/app/actions/feedback';

interface QuickFeedbackProps {
  userId: string;
  contextSkill?: string;
  contextType: 'impulse_completed' | 'skill_started';
  onClose: () => void;
}

export function QuickFeedback({
  userId,
  contextSkill,
  contextType,
  onClose,
}: QuickFeedbackProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Ensure we're on client side for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = () => {
    if (!rating) return;

    startTransition(async () => {
      await submitFeedback(
        userId,
        rating,
        comment || null,
        contextSkill || null,
        contextType
      );
      setSubmitted(true);

      // Auto-close after showing thank you message
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 2500);
    });
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const contextLabel = contextType === 'impulse_completed'
    ? 'KI-Impuls'
    : 'Skill-Fokus';

  // Don't render on server or before mount
  if (!mounted) return null;

  // Use portal to render outside component tree (fixes fixed positioning issues)
  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className="fixed bottom-6 right-6 z-50 w-[340px]"
        >
          <div
            className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Decorative gradient orb */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-2xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative p-5">
              {!submitted ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Beta-Feedback</h3>
                      <p className="text-[11px] text-gray-500">
                        {contextSkill && <span className="text-blue-600">{contextSkill}</span>}
                        {contextSkill && ' • '}
                        {contextLabel}
                      </p>
                    </div>
                  </div>

                  {/* Question */}
                  <p className="text-sm text-gray-700 mb-4">
                    Wie hilfreich war der {contextLabel} für dich?
                  </p>

                  {/* Rating Buttons */}
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setRating('positive')}
                      className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                        rating === 'positive'
                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Top!
                    </button>
                    <button
                      onClick={() => setRating('negative')}
                      className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                        rating === 'negative'
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                          : 'border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Zu theoretisch
                    </button>
                  </div>

                  {/* Comment Textarea */}
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-white/60 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 resize-none placeholder:text-gray-400"
                    placeholder="Was fehlt dir bei diesem Skill-Pfad? (optional)"
                    rows={2}
                  />

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!rating || isPending}
                    className={`w-full mt-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                      rating
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Senden...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Feedback senden
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Thank You State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-bold text-gray-900">Danke für dein Feedback!</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Du hilfst uns, das Career Universe besser zu machen.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
