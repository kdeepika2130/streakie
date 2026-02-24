import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Clock, Trophy, Users, Sparkles, Flame, Star, Target, BarChart, Users2, Quote } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, -100]);

  const features = [
    {
      icon: <Clock size={32} className="text-purple-500" />,
      title: 'Track Your Habits',
      description: 'Create and monitor daily habits with ease. Mark tasks complete to build unstoppable streaks.',
    },
    {
      icon: <Users size={32} className="text-pink-500" />,
      title: 'Join Habit Circles',
      description: 'Stay accountable with friends or communities in public or private groups.',
    },
    {
      icon: <Trophy size={32} className="text-yellow-400" />,
      title: 'Earn Rewards',
      description: 'Unlock badges, level up, and celebrate milestones as you grow.',
    },
  ];

  const testimonials = [
    { name: 'Alex J.', quote: 'StreakMates transformed my routine!', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Samantha L.', quote: 'Badges make habit-building fun!', avatar: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Michael C.', quote: 'Circles keep me accountable.', avatar: 'https://i.pravatar.cc/150?img=3' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{
      backgroundImage: 'url(/bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/70 to-pink-900/80"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-15 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 flex-1 flex items-center z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-12">
            <motion.div
              className="max-w-3xl text-center lg:text-left"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6"
              >
                <Sparkles className="inline-block w-8 h-8 text-yellow-400 mr-2" />
                <span className="text-lg font-semibold text-yellow-300">Welcome to the future of habit tracking</span>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold text-white mb-8 leading-tight drop-shadow-lg">
                Build Habits Together
              </h1>
              <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-2xl mx-auto lg:mx-0 drop-shadow-md leading-relaxed">
                StreakMates empowers circles to build habits, track streaks, and grow with accountability. Start your transformation today and unlock your full potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-pink-500 to-yellow-400 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 shadow-xl"
                    aria-label="Get Started Free"
                  >
                    Get Started Free
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={isAuthenticated ? '/circles' : '/login'}
                    className="border-2 border-white/50 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white transition-all duration-300 shadow-xl backdrop-blur-sm"
                    aria-label={isAuthenticated ? 'Join a Circle' : 'Login'}
                  >
                    {isAuthenticated ? 'Join a Circle' : 'Login'}
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="max-w-lg relative"
              initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ rotateY: -5, scale: 1.05 }}
              style={{ perspective: 1000 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 transform-gpu">
                <img
                  src="image.jpg"
                  alt="Habit tracking dashboard"
                  className="w-full h-auto object-cover rounded-2xl shadow-inner"
                  loading="lazy"
                />
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-200 font-medium">Your dashboard</p>
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <Flame size={20} className="text-yellow-400" />
                    <span className="text-lg font-bold text-white">10-day streak</span>
                    <Star size={16} className="text-yellow-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Why Choose StreakMates?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover the features that make habit building engaging, social, and rewarding.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Join thousands of users who have transformed their lives with StreakMates.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <Quote className="w-8 h-8 text-yellow-400 mb-4" />
                <p className="text-gray-200 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-white/30"
                  />
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
