import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../axiosConfig';
import { 
  Building2, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Plus,
  Filter,
  Search,
  Download,
  Settings,
  Crown,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';

const RecruiterDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/recruiters/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatesByTier = async (domainId, tierId) => {
    try {
      const response = await api.get(`/api/recruiters/candidates?domainId=${domainId}&tierId=${tierId}`);
      setCandidates(response.data.candidates);
      setSelectedTier(response.data.tierInfo);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchAnalytics = async (domainId, tierId) => {
    try {
      const response = await api.get(`/api/recruiters/analytics?domainId=${domainId}&tierId=${tierId}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getSubscriptionBadge = (level) => {
    const badges = {
      'FREE': { color: 'bg-gray-100 text-gray-800', icon: Users },
      'BASIC': { color: 'bg-blue-100 text-blue-800', icon: Shield },
      'PREMIUM': { color: 'bg-purple-100 text-purple-800', icon: Crown },
      'ENTERPRISE': { color: 'bg-yellow-100 text-yellow-800', icon: Zap }
    };
    return badges[level] || badges['FREE'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
              <p className="text-gray-600">Manage your hiring pipeline and access top talent</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {dashboardData?.subscription && (
                <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center ${getSubscriptionBadge(dashboardData.subscription.tier_access_level).color}`}>
                  {React.createElement(getSubscriptionBadge(dashboardData.subscription.tier_access_level).icon, { className: "w-4 h-4 mr-2" })}
                  {dashboardData.subscription.plan_description}
                </div>
              )}
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Post Job
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.stats?.totalJobs || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.stats?.totalApplications || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.stats?.pendingApplications || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">85%</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'candidates', name: 'Candidate Search', icon: Users },
                { id: 'jobs', name: 'Job Management', icon: Briefcase },
                { id: 'analytics', name: 'Analytics', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Recent Applications */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                  <div className="space-y-4">
                    {dashboardData?.recentApplications?.slice(0, 5).map((application) => (
                      <div key={application.application_id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {application.fullName?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{application.fullName}</p>
                              <p className="text-sm text-gray-600">{application.job_title}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              application.status === 'APPLIED' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'VIEWED' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'SHORTLISTED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {application.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(application.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Jobs */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Job Posts</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dashboardData?.activeJobs?.slice(0, 4).map((job) => (
                      <div key={job.job_id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">{job.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{job.domain_name} • {job.tier_name}</span>
                          <span>{job.application_count} applications</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'candidates' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Search Filters */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Search</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <select className="border border-gray-300 rounded-lg px-3 py-2">
                      <option>Select Domain</option>
                      <option>Data Structures & Algorithms</option>
                      <option>Web Development</option>
                      <option>Database Management</option>
                      <option>Machine Learning</option>
                      <option>DevOps & Cloud</option>
                    </select>
                    <select className="border border-gray-300 rounded-lg px-3 py-2">
                      <option>Select Tier</option>
                      <option>Tier 1 - Beginner</option>
                      <option>Tier 2 - Advanced</option>
                      <option>Tier 3 - Expert</option>
                      <option>Tier 4 - Master</option>
                      <option>Tier 5 - Legend</option>
                    </select>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>

                {/* Candidates List */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Candidates</h3>
                  <div className="space-y-4">
                    {candidates.length > 0 ? (
                      candidates.map((candidate) => (
                        <div key={candidate.candidate_id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-lg font-medium text-gray-700">
                                  {candidate.fullName?.charAt(0) || 'A'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{candidate.fullName}</p>
                                <p className="text-sm text-gray-600">Score: {candidate.total_score}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                                    candidate.tier_level === 5 ? 'from-purple-600 to-pink-600' :
                                    candidate.tier_level === 4 ? 'from-blue-600 to-purple-600' :
                                    candidate.tier_level === 3 ? 'from-green-600 to-blue-600' :
                                    candidate.tier_level === 2 ? 'from-yellow-500 to-green-600' :
                                    'from-gray-400 to-gray-600'
                                  } text-white`}>
                                    {candidate.tier_name}
                                  </span>
                                  <span className="text-xs text-gray-500">Rank #{candidate.rank_in_tier}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                                View Profile
                              </button>
                              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                                Contact
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No candidates found. Try adjusting your search filters.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Anonymous Analytics</h3>
                  <p className="text-gray-600 mb-6">
                    View aggregated, anonymous data about candidate pools in different tiers.
                  </p>
                  
                  {analytics ? (
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Tier Statistics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Candidates:</span>
                            <span className="font-medium">{analytics.statistics.total_candidates}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Average Score:</span>
                            <span className="font-medium">{analytics.statistics.average_score?.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Active Candidates:</span>
                            <span className="font-medium">{analytics.statistics.active_candidates}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Skill Distribution</h4>
                        <div className="space-y-2">
                          {analytics.skillDistribution?.slice(0, 3).map((skill, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">Skill {index + 1}:</span>
                              <span className="font-medium">{skill.count} candidates</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Activity Trends</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Recently Active:</span>
                            <span className="font-medium">{analytics.statistics.recently_active}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Period:</span>
                            <span className="font-medium">{analytics.period}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Select a domain and tier to view analytics.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
