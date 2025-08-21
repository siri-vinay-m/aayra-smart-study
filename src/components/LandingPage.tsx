import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  Bell, 
  Star,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Zap,
  Users,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  Rocket,
  Smartphone,
  Laptop,
  Tablet,
  ChevronRight,
  Play,
  MessageSquare,
  Calendar,
  Shield
} from 'lucide-react';

/**
 * FlipStatCard
 * A reusable, accessible flip-card component for showing a headline stat
 * on the front and an explanatory paragraph on the back.
 * - Flips on hover (desktop) and on tap/click (mobile)
 * - Uses inline styles for 3D transforms to avoid requiring custom CSS utilities
 */
const FlipStatCard: React.FC<{
  percentage: string;
  title: string;
  color: 'orange' | 'blue' | 'green' | 'purple';
  icon: React.ComponentType<{ className?: string }>;
  explanation: string;
}> = ({ percentage, title, color, icon: Icon, explanation }) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  // Compute color classes following existing patterns
  const borderColor = {
    orange: 'border-orange-200',
    blue: 'border-blue-200',
    green: 'border-green-200',
    purple: 'border-purple-200',
  }[color];

  const bgGradient = {
    orange: 'from-orange-50',
    blue: 'from-blue-50',
    green: 'from-green-50',
    purple: 'from-purple-50',
  }[color];

  const iconGradientFrom = {
    orange: 'from-orange-500',
    blue: 'from-blue-500',
    green: 'from-green-500',
    purple: 'from-purple-500',
  }[color];

  const iconGradientTo = {
    orange: 'to-orange-600',
    blue: 'to-blue-600',
    green: 'to-green-600',
    purple: 'to-purple-600',
  }[color];

  const textColor = {
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  }[color];

  return (
    <div
      className="relative h-48 cursor-pointer"
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsFlipped((f) => !f);
        }
      }}
      style={{ perspective: 1000 }}
    >
      <div
        className="w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 600ms',
        }}
      >
        {/* Front Face */}
        <Card
          className={`absolute inset-0 text-center p-6 border-2 ${borderColor} bg-gradient-to-br ${bgGradient} to-white`}
          style={{ backfaceVisibility: 'hidden' as React.CSSProperties['backfaceVisibility'] }}
        >
          <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${iconGradientFrom} ${iconGradientTo} rounded-full flex items-center justify-center`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className={`text-3xl font-bold ${textColor} mb-2`}>{percentage}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
        </Card>

        {/* Back Face */}
        <Card
          className={`absolute inset-0 p-6 border-2 ${borderColor} bg-background/90 backdrop-blur-sm`}
          style={{
            backfaceVisibility: 'hidden' as React.CSSProperties['backfaceVisibility'],
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 bg-gradient-to-br ${iconGradientFrom} ${iconGradientTo} rounded-full flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-foreground">{title}</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
            <div className="mt-auto pt-3 text-xs text-muted-foreground/80">Tap or hover to flip back</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

/**
 * High-converting landing page for Aayra Smart Study app
 * Features infographics, quantitative results, and learner-focused messaging
 */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/AayraFavicon.png" alt="Aayra Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-foreground">Aayra</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#results" className="text-muted-foreground hover:text-primary transition-colors">Results</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Reviews</a>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90">
                  Start 45-Day Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Infographic */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-orange-100 text-orange-700 border-orange-200">
              🚀 AI-Powered Learning Platform for Modern Learners
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transform Your Learning with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600"> AI Intelligence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Master any subject faster with Focused timer, AI tutoring, smart notifications, and optimized review reminders. 
              Join 12,000+ learners achieving 42% improvement in study consistency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold">
                  Start Learning for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ✅ No credit card required • ✅ 45-day free trial • ✅ Cancel anytime
            </p>
          </div>

          {/* Results Infographic */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <FlipStatCard
              percentage="54%"
              title="Improvement in Retention"
              color="orange"
              icon={TrendingUp}
              explanation="Aayra boosts long-term memory with active recall quizzes, AI summaries, and spaced repetition. Consistent review schedules bring back the right concepts just before you forget."
            />
            <FlipStatCard
              percentage="42%"
              title="Improvement in Consistency"
              color="blue"
              icon={Target}
              explanation="Smart notifications fit your routine, while streaks and gentle nudges build lasting habits. A consistent schedule strengthens your discipline and helps you show up every day."
            />
            <FlipStatCard
              percentage="38%"
              title="Reduction in Study Time"
              color="green"
              icon={Clock}
              explanation="AI condenses materials into focused summaries, flashcards, and targeted practice. The focus timer and prioritized reviews cut busywork and keep you working on what matters most."
            />
            <FlipStatCard
              percentage="89%"
              title="Learner Success Rate"
              color="purple"
              icon={Award}
              explanation="Distraction-free study sessions, AI-condensed materials, smart notifications tailored to your routine, and optimized review schedules keeps you aligned with your learning goals."
            />
          </div>

          {/* Trust Indicators with Graphics */}
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70 mb-16">
            <div className="flex items-center space-x-2">
              <img src="/AayraFavicon.png" alt="Aayra" className="w-6 h-6" />
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">12,000+ Learners</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Privacy Protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Flow Infographic */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Aayra Transforms Your Learning Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Focus → AI processing → Break → Spaced review. Repeat for steady progress.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                icon: Target,
                title: "Focused Study",
                description: "Start a focused study session with goals and a timer to stay on track.",
                color: "orange"
              },
              {
                step: "2",
                icon: Brain,
                title: "AI Processing",
                description: "Aayra analyzes your materials and generates summaries, questions, and flashcards.",
                color: "blue"
              },
              {
                step: "3",
                icon: Activity,
                title: "Well Deserved Break",
                description: "Take a refreshing, guided break to recharge without losing momentum.",
                color: "green"
              },
              {
                step: "4",
                icon: Bell,
                title: "Spaced Repetition",
                description: "Get smart review reminders at the right time to lock knowledge into memory.",
                color: "purple"
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-full flex items-center justify-center relative`}>
                  <item.icon className="w-10 h-10 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-800">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                {index < 3 && (
                  <ChevronRight className="w-6 h-6 text-gray-300 absolute top-10 -right-3 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Visual Elements */}
      <section id="features" className="py-20 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything Learners Need to Excel
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to accelerate learning and maximize retention
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Learning",
                description: "Get instant explanation summaries, flashcards, and practice questions generated by AI based on your material.",
                metric: "73% faster comprehension"
              },
              {
                icon: Bell,
                title: "Smart Notifications",
                description: "Never miss a study session with intelligent reminders that adapt to your schedule and preferences.",
                metric: "91% consistency improvement"
              },
              {
                icon: Target,
                title: "Progress Tracking",
                description: "Monitor your learning journey with detailed analytics and insights to optimize study efficiency.",
                metric: "Real-time analytics"
              },
              {
                icon: Clock,
                title: "Focus Timer",
                description: "Built-in Pomodoro timer with break reminders to maintain peak concentration and avoid burnout.",
                metric: "25 min optimal sessions"
              },
              {
                icon: BookOpen,
                title: "Optimized Review Reminders",
                description: "Receive review notifications optimized based on scientifically proven retention rates.",
                metric: "54% Retention Improvement"
              },
              {
                icon: Smartphone,
                title: "Multi-Platform Access",
                description: "Study anywhere with seamless sync across all your devices - mobile, tablet, and desktop.",
                metric: "iOS, Android, Web"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">{feature.description}</p>
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    {feature.metric}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results Dashboard Visualization */}
      <section id="results" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why 12,000+ Learners Choose Aayra
              </h2>
              <div className="space-y-6">
                {[
                  { text: "Reduce study time by 38% by maintaining consistent schedules and focused study sprints", stat: "38%" },
                  { text: "Improve retention rates with spaced repetition and adaptive testing", stat: "54%" },
                  { text: "Stay motivated with smart notifications, progress tracking and achievements", stat: "89%" },
                  { text: "Access your study materials anywhere with cross-platform sync", stat: "24/7" }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-muted-foreground text-lg">{benefit.text}</p>
                      <Badge className="mt-1 bg-green-100 text-green-700">{benefit.stat}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Start Your 45-Day Free Trial
                    <Zap className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              {/* Mock Dashboard */}
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-2xl p-8 backdrop-blur-sm border">
                <div className="flex items-center mb-6">
                  <img src="/AayraFavicon.png" alt="Aayra" className="w-8 h-8 mr-3" />
                  <h3 className="text-lg font-semibold">Learning Dashboard</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Study Streak</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700">15 days</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Weekly Progress</span>
                    </div>
                    <span className="text-primary font-bold">94%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">Next Session</span>
                    </div>
                    <span className="text-muted-foreground">In 45 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Device Compatibility Graphic */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Learn Anywhere, Anytime
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Seamless experience across all your devices with real-time sync
          </p>
          
          <div className="flex justify-center items-end space-x-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 mx-auto flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium">Mobile</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 mx-auto flex items-center justify-center">
                <Tablet className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm font-medium">Tablet</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 mx-auto flex items-center justify-center">
                <Laptop className="w-12 h-12 text-white" />
              </div>
              <p className="text-sm font-medium">Desktop</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <Activity className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground">Your progress syncs instantly across all devices</p>
            </Card>
            <Card className="p-6 text-center">
              <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Easy Access</h3>
              <p className="text-sm text-muted-foreground">Study without being tied to one device.</p>
            </Card>
            <Card className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">AI at your fingertips</h3>
              <p className="text-sm text-muted-foreground">Aayra AI make studying easier and effective.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved by Learners Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our users say about their learning transformation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Law Student",
                content: "Aayra helped me cut my study time while improving my test scores by 50%. The AI generated materials are incredibly helpful!",
                rating: 5,
                improvement: "-38% Study Time"
              },
              {
                name: "Marcus Rodriguez",
                role: "Software Engineer",
                content: "The smart notifications improved my consistency. I finally have a study routine that actually works.",
                rating: 5,
                improvement: "+42% consistency"
              },
              {
                name: "Emily Watson",
                role: "Medical Practitioner",
                content: "The spaced repetition feature is a game-changer. Now I can not only study efficiently but also retain information for longer.",
                rating: 5,
                improvement: "+54% retention"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 bg-background/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <img src="/AayraFavicon.png" alt="Aayra" className="w-6 h-6 mr-2" />
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                      ))}
                </div>
              </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex justify-between items-center">
                <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      {testimonial.improvement}
                    </Badge>
              </div>
                </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-100 to-orange-200/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Learn Smarter?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are saving time and remembering more with Aayra.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Your Free 45-Day Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/AayraFavicon.png" alt="Aayra Logo" className="w-8 h-8" />
                <span className="text-xl font-bold text-foreground">Aayra</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Empowering learners worldwide with AI-driven learning solutions for faster, more effective studying.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="text-xs">54% Better Retention</Badge>
                <Badge variant="outline" className="text-xs">42% More Consistent</Badge>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#results" className="hover:text-primary transition-colors">Results</a></li>
                <li><Link to="/register" className="hover:text-primary transition-colors">45-Day Trial</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><a href="mailto:support@aayra.app" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground">
            <p>&copy; 2025 Aayra. All rights reserved.</p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <img src="/AayraFavicon.png" alt="Aayra" className="w-4 h-4" />
              <span className="text-xs">Trusted by 12,000+ learners</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;