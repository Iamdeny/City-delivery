/**
 * CTA Section - Client Component для анимаций
 */
'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-4">
            Готовы начать покупки?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Более 1000 товаров ждут вас. Быстрая доставка, удобная оплата.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/products')}
            className="px-10 py-4 bg-white text-purple-600 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
          >
            Перейти к товарам
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
