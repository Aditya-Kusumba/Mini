import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../axiosConfig';
import { useParams } from 'react-router-dom';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  Clock, 
  Calendar,
  BarChart3,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react';

const TierDashboard = () => {
  const { domainId } = useParams();
  const [domain, setDomain] = useState(null);
  const [tierInfo, setTierInfo] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [availableTiers, setAvailableTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (domainId) {
      fetchTierData();
    }
  }, [domainId]);

  const fetchTierData = async () => {
    try {
      const [tierResponse, leaderboardResponse, tiersResponse] = await Promise.all([
        api.get(`/api/tiers/domain/${domainId}`),
        api.get(`/api/tiers/domain/${domainId}/leaderboard`),
        api.get(`/api/tiers/domain/${domainId}/tiers`)
      ]);

      setTierInfo(tierResponse.data);
      setLeaderboard(leaderboardResponse.data.leaderboard);
      setAvailableTiers(tiersResponse.data);
      setDomain(tierResponse.data.domain_name);
    } catch (error) {
      console.error('Error fetching tier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tierLevel) => {
    const colors = {
      5: 'from-purple-600 to-pink-600',
      4: 'from-blue-600 to-purple-600',
      3: 'from-green-600 to-blue-600',
      2: 'from-yellow-500 to-green-600',
      1: 'from-gray-400 to-gray-600'
    };
    return colors[tierLevel] || colors[1];
  };

  const getTierIcon = (tierLevel) => {
    const icons = {
      5: '👑',
      4: '💎',
      3: '🏆',
      2: '🥈',
      1: '🥉'
    };
    return icons[tierLevel] || icons[1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tier information...</p>
        </div>
      </div>
    );
  }

  if (!tierInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Tier Assigned</h2>
          <p className="text-gray-600 mb-6">
            You haven't been assigned to a tier yet. Take the initial assessment to get placed in a tier.
          </p>
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Take Initial Assessment
          </button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {domain} Dashboard
          </h1>
          <p className="text-gray-600">Track your progress and compete with other candidates</p>
        </motion.div>

        {/* Tier Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${getTierColor(tierInfo.tier_level)} flex items-center justify-center text-3xl`}>
                {getTierIcon(tierInfo.tier_level)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{tierInfo.tier_name}</h2>
                <p className="text-gray-600">Tier {tierInfo.tier_level} • Rank #{tierInfo.current_rank}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {tierInfo.current_tier_count}/{tierInfo.max_slots || '∞'} slots occupied
                  </span>
                  <div className="ml-4 w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${tierInfo.tierUtilization}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{tierInfo.total_score}</div>
              <div className="text-sm text-gray-500">Total Score</div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {tierInfo.nextTier && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress to {tierInfo.nextTier.tier_name}</span>
                <span className="text-sm text-gray-500">{tierInfo.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${tierInfo.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">{tierInfo.average_score?.toFixed(1)}</p>
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
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Participations</p>
                <p className="text-2xl font-semibold text-gray-900">{tierInfo.participation_count}</p>
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
                <p className="text-sm font-medium text-gray-600">Rank in Tier</p>
                <p className="text-2xl font-semibold text-gray-900">#{tierInfo.rank_in_tier}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Active</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(tierInfo.last_active).toLocaleDateString()}
                </p>
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
                { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
                { id: 'tiers', name: 'Tier System', icon: Award }
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
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Score</span>
                        <span className="font-semibold text-gray-900">{tierInfo.total_score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Score</span>
                        <span className="font-semibold text-gray-900">{tierInfo.average_score?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Participation Count</span>
                        <span className="font-semibold text-gray-900">{tierInfo.participation_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Tier</span>
                        <span className="font-semibold text-gray-900">{tierInfo.tier_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tier Level</span>
                        <span className="font-semibold text-gray-900">{tierInfo.tier_level}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Max Slots</span>
                        <span className="font-semibold text-gray-900">{tierInfo.max_slots || 'Unlimited'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
                      Take Practice Test
                    </button>
                    <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
                      View Study Materials
                    </button>
                    <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
                      Join Contest
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Domain Leaderboard</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Your Position:</span>
                    <span className="font-semibold text-indigo-600">#{tierInfo.current_rank}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaderboard.slice(0, 20).map((candidate, index) => (
                          <tr key={candidate.candidate_id} className={candidate.isCurrentUser ? 'bg-indigo-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index < 3 ? (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {candidate.fullName?.charAt(0) || 'A'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {candidate.fullName || 'Anonymous'}
                                  </div>
                                  <div className="text-sm text-gray-500">{candidate.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getTierColor(candidate.tier_level)} text-white`}>
                                {candidate.tier_name}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {candidate.total_score}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                candidate.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                candidate.status === 'WAITING_LIST' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {candidate.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tiers' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Tier System Overview</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableTiers.map((tier) => (
                    <div key={tier.tier_id} className={`rounded-lg p-6 border-2 ${
                      tier.tier_id === tierInfo.tier_id 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getTierColor(tier.tier_level)} flex items-center justify-center text-white text-xl mr-4`}>
                          {getTierIcon(tier.tier_level)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{tier.tier_name}</h4>
                          <p className="text-sm text-gray-600">Level {tier.tier_level}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Score Range:</span>
                          <span className="font-medium">{tier.min_score}-{tier.max_score}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Occupancy:</span>
                          <span className="font-medium">{tier.occupancy_status}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-medium">${tier.yearly_cost}/year</span>
                        </div>
                      </div>
                      
                      {tier.tier_id === tierInfo.tier_id && (
                        <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium text-center">
                          Current Tier
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierDashboard;
