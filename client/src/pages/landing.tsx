import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isScrolled ? 0 : -100, 
          opacity: isScrolled ? 1 : 0 
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 glass-modern border-b border-white/20"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary squircle-lg flex items-center justify-center">
                <i className="fas fa-city text-white text-xl"></i>
              </div>
              <span className="text-2xl font-bold text-white">Raipur Smart Connect</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <motion.a 
                href="#features" 
                className="text-white hover:text-accent transition-colors magnetic-button px-4 py-2 bg-white/10 hover:bg-white/20 squircle-md"
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >Features</motion.a>
              <motion.a 
                href="#how-it-works" 
                className="text-white hover:text-accent transition-colors magnetic-button px-4 py-2 bg-white/10 hover:bg-white/20 squircle-md"
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >How It Works</motion.a>
              <motion.a 
                href="#stats" 
                className="text-white hover:text-accent transition-colors magnetic-button px-4 py-2 bg-white/10 hover:bg-white/20 squircle-md"
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >Impact</motion.a>
              <motion.a 
                href="#pricing" 
                className="text-white hover:text-accent transition-colors magnetic-button px-4 py-2 bg-white/10 hover:bg-white/20 squircle-md"
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >Pricing</motion.a>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  className="modern-button magnetic-button ripple bg-white text-primary hover:bg-gray-100 px-6 py-2 btn-squircle"
                  data-testid="button-login"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Login
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero-enhanced min-h-screen flex items-center pattern-overlay pb-24">
        {/* Floating Particles */}
        <div className="floating-particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
        </div>
        {/* Morphing Background Elements */}
        <div className="morphing-bg"></div>
        <div className="morphing-bg-2"></div>
        <div className="container mx-auto px-6 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="mb-8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-block">
                <motion.div 
                  className="w-24 h-24 bg-white bg-opacity-20 icon-squircle-xl flex items-center justify-center mb-6 mx-auto pulse-glow glow-on-hover"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-city text-4xl"></i>
                </motion.div>
              </div>
            </motion.div>
            <motion.h1 
              className="text-7xl font-bold mb-6 leading-tight"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            >
              Transform Your
              <motion.span 
                className="block text-gradient bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              >
                Civic Experience
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            >
              Join thousands of citizens using AI-powered solutions to create a smarter, more responsive city. Report issues, track progress, and build community.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  size="lg"
                  className="modern-button magnetic-button ripple glow-on-hover bg-white text-primary hover:bg-gray-100 px-12 py-6 text-xl font-semibold btn-squircle-lg"
                  data-testid="button-get-started"
                >
                  <motion.i 
                    className="fas fa-rocket mr-3"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  Get Started Free
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline"
                  size="lg"
                  className="modern-button magnetic-button ripple border-2 border-white bg-white/10 text-white hover:bg-white hover:text-primary px-12 py-6 text-xl font-semibold btn-squircle-lg"
                >
                  <motion.i 
                    className="fas fa-play mr-3"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.2,
                    delayChildren: 1.2
                  }
                }
              }}
            >
              <motion.div 
                className="glass-modern card-squircle-lg p-6 floating-card glow-on-hover"
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
                whileHover={{ y: -10, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-4xl font-bold mb-2 text-yellow-300"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                >10K+</motion.div>
                <div className="text-lg opacity-90">Active Citizens</div>
              </motion.div>
              <motion.div 
                className="glass-modern card-squircle-lg p-6 floating-card glow-on-hover"
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
                whileHover={{ y: -10, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-4xl font-bold mb-2 text-green-300"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.7, type: "spring", stiffness: 200 }}
                >95%</motion.div>
                <div className="text-lg opacity-90">Issues Resolved</div>
              </motion.div>
              <motion.div 
                className="glass-modern card-squircle-lg p-6 floating-card glow-on-hover"
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
                whileHover={{ y: -10, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-4xl font-bold mb-2 text-blue-300"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.9, type: "spring", stiffness: 200 }}
                >24h</motion.div>
                <div className="text-lg opacity-90">Avg Response</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        className="py-24 bg-background"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-5xl font-bold text-gradient mb-6 animate-gradient"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >Powerful Features</motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Experience the future of civic engagement with our comprehensive suite of tools designed for modern citizens.
            </motion.p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8" 
            style={{ gridAutoRows: '1fr' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            <motion.div
              variants={{
                hidden: { y: 80, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Card className="floating-card neon-border p-8 card-3d magnetic-button card-squircle-lg h-full">
                <CardContent className="text-center h-full flex flex-col justify-between">
                  <div className="w-20 h-20 bg-primary icon-squircle-xl flex items-center justify-center mx-auto mb-6 pulse-glow">
                    <i className="fas fa-robot text-3xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">AI-Powered Assistant</h3>
                  <p className="text-muted-foreground mb-6">
                    Get instant help with water bills, tax deadlines, bus schedules, and more through our multilingual chatbot powered by advanced AI.
                  </p>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> 24/7 Availability</div>
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> Multi-language Support</div>
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> Smart Recommendations</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={{
                hidden: { y: 80, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Card className="floating-card neon-border p-8 card-3d magnetic-button card-squircle-lg h-full">
                <CardContent className="text-center h-full flex flex-col justify-between">
                  <div className="w-20 h-20 bg-secondary icon-squircle-xl flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-file-alt text-3xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">Smart Complaint System</h3>
                  <p className="text-muted-foreground mb-6">
                    Register complaints with photos, GPS location, and track real-time status updates with unique ticket IDs and automated categorization.
                  </p>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> Photo & Video Upload</div>
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> GPS Location Tracking</div>
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> Real-time Updates</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={{
                hidden: { y: 80, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Card className="floating-card neon-border p-8 card-3d magnetic-button card-squircle-lg h-full">
                <CardContent className="text-center h-full flex flex-col justify-between">
                  <div className="w-20 h-20 bg-accent icon-squircle-xl flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-users text-3xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">Community Collaboration</h3>
                  <p className="text-muted-foreground mb-6">
                    Upvote community issues, collaborate on solutions, and help prioritize city-wide problems with democratic participation.
                  </p>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> Community Voting</div>
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> Solution Sharing</div>
                    <div className="flex items-center"><i className="fas fa-check text-primary mr-2"></i> Impact Tracking</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        id="how-it-works" 
        className="py-24 modern-gradient text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-5xl font-bold mb-6 animate-gradient"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >How It Works</motion.h2>
            <motion.p 
              className="text-xl opacity-90 max-w-3xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Simple, intuitive, and powerful. Get started in minutes and see results immediately.
            </motion.p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            <motion.div 
              className="text-center"
              variants={{
                hidden: { y: 80, opacity: 0, scale: 0.8 },
                visible: { y: 0, opacity: 1, scale: 1 }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="glass-modern w-24 h-24 squircle-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold glow-on-hover magnetic-button"
                whileHover={{ scale: 1.2, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200 }}
              >1</motion.div>
              <h3 className="text-2xl font-bold mb-4">Sign Up</h3>
              <p className="opacity-90">Create your free account in seconds using social login or email verification.</p>
            </motion.div>
            <motion.div 
              className="text-center"
              variants={{
                hidden: { y: 80, opacity: 0, scale: 0.8 },
                visible: { y: 0, opacity: 1, scale: 1 }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="glass-modern w-24 h-24 squircle-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold glow-on-hover magnetic-button"
                whileHover={{ scale: 1.2, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200 }}
              >2</motion.div>
              <h3 className="text-2xl font-bold mb-4">Report Issues</h3>
              <p className="opacity-90">Use our smart forms to report civic issues with photos, location, and detailed descriptions.</p>
            </motion.div>
            <motion.div 
              className="text-center"
              variants={{
                hidden: { y: 80, opacity: 0, scale: 0.8 },
                visible: { y: 0, opacity: 1, scale: 1 }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="glass-modern w-24 h-24 squircle-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold glow-on-hover magnetic-button"
                whileHover={{ scale: 1.2, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200 }}
              >3</motion.div>
              <h3 className="text-2xl font-bold mb-4">Track Progress</h3>
              <p className="opacity-90">Get real-time updates on your complaints and see the impact of your civic participation.</p>
            </motion.div>
            <motion.div 
              className="text-center"
              variants={{
                hidden: { y: 80, opacity: 0, scale: 0.8 },
                visible: { y: 0, opacity: 1, scale: 1 }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="glass-modern w-24 h-24 squircle-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold glow-on-hover magnetic-button"
                whileHover={{ scale: 1.2, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200 }}
              >4</motion.div>
              <h3 className="text-2xl font-bold mb-4">Build Community</h3>
              <p className="opacity-90">Collaborate with neighbors, vote on priorities, and create positive change together.</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section id="stats" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gradient mb-6">Real Impact, Real Numbers</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how our platform is transforming civic engagement across Raipur and beyond.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center floating-card bg-card p-8 icon-squircle-xl">
              <div className="text-6xl font-bold text-primary mb-4">15K+</div>
              <div className="text-xl font-semibold text-foreground mb-2">Active Citizens</div>
              <div className="text-muted-foreground">Engaged daily</div>
            </div>
            <div className="text-center floating-card bg-card p-8 icon-squircle-xl">
              <div className="text-6xl font-bold text-secondary mb-4">8.2K</div>
              <div className="text-xl font-semibold text-foreground mb-2">Issues Resolved</div>
              <div className="text-muted-foreground">This year</div>
            </div>
            <div className="text-center floating-card bg-card p-8 icon-squircle-xl">
              <div className="text-6xl font-bold text-accent mb-4">18h</div>
              <div className="text-xl font-semibold text-foreground mb-2">Avg Response</div>
              <div className="text-muted-foreground">Time</div>
            </div>
            <div className="text-center floating-card bg-card p-8 icon-squircle-xl">
              <div className="text-6xl font-bold text-primary mb-4">96%</div>
              <div className="text-xl font-semibold text-foreground mb-2">Satisfaction</div>
              <div className="text-muted-foreground">Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 modern-gradient text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">What Citizens Say</h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Real stories from real people making a difference in their communities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-effect border-white/20 p-8 card-squircle-lg">
              <CardContent className="text-white">
                <div className="flex mb-4">
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                </div>
                <p className="text-lg mb-6 italic">
                  "The AI assistant helped me resolve my water bill issue in minutes. No more waiting in long queues!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 squircle-full flex items-center justify-center mr-4">
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <div className="font-semibold">Priya Sharma</div>
                    <div className="text-sm opacity-75">Raipur Resident</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/20 p-8 card-squircle-lg">
              <CardContent className="text-white">
                <div className="flex mb-4">
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                </div>
                <p className="text-lg mb-6 italic">
                  "Finally, a platform where my voice matters. The community voting feature helps prioritize real issues."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 squircle-full flex items-center justify-center mr-4">
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <div className="font-semibold">Rajesh Kumar</div>
                    <div className="text-sm opacity-75">Community Leader</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/20 p-8 card-squircle-lg">
              <CardContent className="text-white">
                <div className="flex mb-4">
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                  <i className="fas fa-star text-yellow-400"></i>
                </div>
                <p className="text-lg mb-6 italic">
                  "The real-time tracking gave me confidence that my street lighting complaint was being handled."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 squircle-full flex items-center justify-center mr-4">
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <div className="font-semibold">Anita Patel</div>
                    <div className="text-sm opacity-75">Small Business Owner</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gradient mb-6">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Free for citizens, premium features for organizations and government bodies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="floating-card p-8 relative card-squircle-lg">
              <CardContent>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4">Citizen</h3>
                  <div className="text-5xl font-bold text-primary mb-2">Free</div>
                  <div className="text-muted-foreground">Forever</div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Unlimited Complaints</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>AI Assistant</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Real-time Tracking</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Community Features</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Mobile App</div>
                </div>
                <Button className="w-full modern-button magnetic-button ripple glow-on-hover" size="lg">
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            <Card className="floating-card p-8 relative border-2 border-primary cool-shadow card-squircle-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-6 py-2 squircle-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
              <CardContent>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4">Organization</h3>
                  <div className="text-5xl font-bold text-primary mb-2">₹999</div>
                  <div className="text-muted-foreground">per month</div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Everything in Citizen</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Advanced Analytics</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Priority Support</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Custom Branding</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>API Access</div>
                </div>
                <Button className="w-full modern-button magnetic-button ripple glow-on-hover" size="lg">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="floating-card p-8 relative card-squircle-lg">
              <CardContent>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                  <div className="text-5xl font-bold text-primary mb-2">Custom</div>
                  <div className="text-muted-foreground">Let's talk</div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Everything in Organization</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>White-label Solution</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Dedicated Support</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>Custom Integrations</div>
                  <div className="flex items-center"><i className="fas fa-check text-primary mr-3"></i>SLA Guarantee</div>
                </div>
                <Button variant="outline" className="w-full modern-button magnetic-button ripple" size="lg">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 modern-gradient text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Got questions? We've got answers. Find everything you need to know about our platform.
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="glass-effect border-white/20 p-6 card-squircle-lg">
              <CardContent className="text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <i className="fas fa-question-circle mr-3 text-accent"></i>
                  Is this platform really free for citizens?
                </h3>
                <p className="opacity-90 pl-8">
                  Absolutely! All core features including complaint registration, AI assistant, tracking, and community features are completely free for citizens. We believe civic engagement should be accessible to everyone.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/20 p-6 card-squircle-lg">
              <CardContent className="text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <i className="fas fa-question-circle mr-3 text-accent"></i>
                  How does the AI assistant work?
                </h3>
                <p className="opacity-90 pl-8">
                  Our AI assistant uses advanced natural language processing to understand your queries in English, Hindi, and Marathi. It can help with water bills, tax information, bus schedules, complaint status, and much more.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/20 p-6 card-squircle-lg">
              <CardContent className="text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <i className="fas fa-question-circle mr-3 text-accent"></i>
                  How secure is my personal information?
                </h3>
                <p className="opacity-90 pl-8">
                  We take privacy seriously. All data is encrypted, we follow GDPR guidelines, and we never share personal information without consent. Your data is used only to improve civic services.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/20 p-6 card-squircle-lg">
              <CardContent className="text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <i className="fas fa-question-circle mr-3 text-accent"></i>
                  Can I track the status of my complaints?
                </h3>
                <p className="opacity-90 pl-8">
                  Yes! Every complaint gets a unique ticket ID and you can track its progress in real-time. You'll receive notifications at every stage - from acknowledgment to resolution.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/20 p-6 card-squircle-lg">
              <CardContent className="text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <i className="fas fa-question-circle mr-3 text-accent"></i>
                  Is there a mobile app available?
                </h3>
                <p className="opacity-90 pl-8">
                  Our platform is fully responsive and works great on mobile browsers. Native iOS and Android apps are coming soon with additional features like offline complaint drafting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gradient mb-6">Ready to Transform Your City?</h2>
            <p className="text-2xl text-muted-foreground mb-12">
              Join thousands of citizens already making a difference. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                size="lg"
                className="modern-button px-12 py-6 text-xl font-semibold card-squircle-lg"
                data-testid="button-join-now"
              >
                <i className="fas fa-rocket mr-3"></i>
                Join Now - It's Free
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="modern-button px-12 py-6 text-xl font-semibold card-squircle-lg"
              >
                <i className="fas fa-envelope mr-3"></i>
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary card-squircle-lg flex items-center justify-center">
                  <i className="fas fa-city text-white text-xl"></i>
                </div>
                <span className="text-2xl font-bold text-gradient">Raipur Smart Connect</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Empowering citizens through technology for a smarter, more responsive city.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 transition-colors cursor-pointer">
                  <i className="fab fa-facebook-f text-white"></i>
                </div>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 transition-colors cursor-pointer">
                  <i className="fab fa-twitter text-white"></i>
                </div>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 transition-colors cursor-pointer">
                  <i className="fab fa-linkedin-in text-white"></i>
                </div>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 transition-colors cursor-pointer">
                  <i className="fab fa-instagram text-white"></i>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xl font-bold text-foreground mb-6">Quick Links</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="/api/login" className="hover:text-primary transition-colors">Login</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Mobile App</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-bold text-foreground mb-6">Services</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Complaint Registration</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">AI Assistant</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community Forum</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Real-time Tracking</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Analytics Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-bold text-foreground mb-6">Contact Info</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-center">
                  <i className="fas fa-phone text-primary mr-3"></i>
                  +91 771 234 5678
                </li>
                <li className="flex items-center">
                  <i className="fas fa-envelope text-primary mr-3"></i>
                  help@raipurconnect.gov.in
                </li>
                <li className="flex items-center">
                  <i className="fas fa-map-marker-alt text-primary mr-3"></i>
                  Nagar Nigam Bhawan, Raipur
                </li>
                <li className="flex items-center">
                  <i className="fas fa-clock text-primary mr-3"></i>
                  24/7 AI Support Available
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center">
            <p className="text-muted-foreground">
              © 2024 Raipur Smart Connect. All rights reserved. | 
              <a href="#" className="hover:text-primary transition-colors ml-1">Privacy Policy</a> | 
              <a href="#" className="hover:text-primary transition-colors ml-1">Terms of Service</a> |
              <a href="#" className="hover:text-primary transition-colors ml-1">Cookie Policy</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
