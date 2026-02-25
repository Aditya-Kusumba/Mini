import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowRight, 
  Trophy, 
  Users, 
  Target, 
  Zap, 
  Shield,
  Star,
  Code,
  Briefcase,
  BarChart3
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Trophy,
      title: 'Tier-Based System',
      description: 'Compete and climb through different tiers based on your skills and performance'
    },
    {
      icon: Target,
      title: 'Domain Specialization',
      description: 'Focus on your preferred domains like Web Development, Data Science, and more'
    },
    {
      icon: Zap,
      title: 'Real-time Contests',
      description: 'Participate in weekly contests and shifting tests to improve your ranking'
    },
    {
      icon: Shield,
      title: 'Secure Assessment',
      description: 'Comprehensive coding challenges with plagiarism detection and fair evaluation'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Candidates' },
    { number: '500+', label: 'Companies' },
    { number: '50+', label: 'Job Placements' },
    { number: '95%', label: 'Success Rate' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Elevate Your Career with
                <span className="gradient-text"> Tier-Based Hiring</span>
              </h1>
              <p className="hero-description">
                Join thousands of candidates competing in skill-based tiers. 
                Get matched with top companies based on your performance and expertise.
              </p>
              <div className="hero-actions">
                {!isAuthenticated ? (
                  <>
                    <Link to="/register" className="btn btn-primary btn-lg">
                      Get Started
                      <ArrowRight size={20} />
                    </Link>
                    <Link to="/login" className="btn btn-secondary btn-lg">
                      Login
                    </Link>
                    <Link to="/adminlogin" className="btn btn-secondary btn-lg">
                      Admin
                    </Link>
                  </>
                ) : (
                  <Link to="/dashboard" className="btn btn-primary btn-lg">
                    Go to Dashboard
                    <ArrowRight size={20} />
                  </Link>
                )}
              </div>
            </div>
            <div className="hero-visual">
              <div className="floating-cards">
                <div className="card floating-card-1">
                  <Code size={24} />
                  <span>Code Challenges</span>
                </div>
                <div className="card floating-card-2">
                  <Trophy size={24} />
                  <span>Tier Rankings</span>
                </div>
                <div className="card floating-card-3">
                  <Briefcase size={24} />
                  <span>Job Matches</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose TierHire?</h2>
            <p className="section-description">
              Experience the future of tech recruitment with our innovative tier-based system
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card card">
                  <div className="feature-icon">
                    <Icon size={32} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">
              Simple steps to land your dream job
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Choose Your Domain</h3>
                <p>Select from Web Development, Data Science, Mobile Development, and more</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Take Assessment</h3>
                <p>Complete coding challenges and technical assessments</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get Tier Placement</h3>
                <p>Be placed in a tier based on your performance and skills</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Land Your Job</h3>
                <p>Get matched with companies looking for talent in your tier</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Journey?</h2>
            <p className="cta-description">
              Join thousands of developers who have already found their dream jobs through TierHire
            </p>
            {!isAuthenticated && (
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Now
                  <ArrowRight size={20} />
                </Link>
                <Link to="/recruiter/register" className="btn btn-secondary btn-lg">
                  For Recruiters
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
