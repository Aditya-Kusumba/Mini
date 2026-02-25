import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import { 
  Code, 
  Database, 
  Globe, 
  Brain, 
  Cloud, 
  ArrowRight, 
  Trophy, 
  Users,
  Clock,
  Target
} from 'lucide-react';

const DomainSelection = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const domainIcons = {
    'Data Structures & Algorithms': Code,
    'Web Development': Globe,
    'Database Management': Database,
    'Machine Learning': Brain,
    'DevOps & Cloud': Cloud
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await api.get('/api/domains');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainToggle = (domain) => {
    setSelectedDomains(prev => {
      if (prev.find(d => d.domain_id === domain.domain_id)) {
        return prev.filter(d => d.domain_id !== domain.domain_id);
      } else {
        return [...prev, domain];
      }
    });
  };

  const handleContinue = () => {
    if (selectedDomains.length === 0) {
      alert('Please select at least one domain to continue');
      return;
    }
    
    // Store selected domains in localStorage or context
    localStorage.setItem('selectedDomains', JSON.stringify(selectedDomains));
    navigate('/dashboard');
  };

  const getTierInfo = (domain) => {
    const tiers = [
      { level: 5, name: 'Legend', color: 'bg-gradient-to-r from-purple-600 to-pink-600' },
      { level: 4, name: 'Master', color: 'bg-gradient-to-r from-blue-600 to-purple-600' },
      { level: 3, name: 'Expert', color: 'bg-gradient-to-r from-green-600 to-blue-600' },
      { level: 2, name: 'Advanced', color: 'bg-gradient-to-r from-yellow-500 to-green-600' },
      { level: 1, name: 'Beginner', color: 'bg-gradient-to-r from-gray-400 to-gray-600' }
    ];
    
    return tiers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Domains
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the domains you want to be assessed in. You can choose multiple domains 
            and will be placed in tiers based on your performance.
          </p>
        </motion.div>

        {/* Domain Selection */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {domains.map((domain, index) => {
            const Icon = domainIcons[domain.domain_name] || Code;
            const isSelected = selectedDomains.find(d => d.domain_id === domain.domain_id);
            
            return (
              <motion.div
                key={domain.domain_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                  isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:shadow-md'
                }`}
                onClick={() => handleDomainToggle(domain)}
              >
                <div className="bg-white rounded-xl p-6 h-full border border-gray-200">
                  {/* Domain Icon */}
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {domain.domain_name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4">
                    {domain.description}
                  </p>

                  {/* Tier Preview */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Tier System:</p>
                    <div className="flex space-x-1">
                      {getTierInfo(domain).map((tier, tierIndex) => (
                        <div
                          key={tierIndex}
                          className={`w-8 h-8 rounded-full ${tier.color} flex items-center justify-center`}
                          title={`Tier ${tier.level}: ${tier.name}`}
                        >
                          <span className="text-xs font-bold text-white">{tier.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selection Summary */}
        {selectedDomains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 mb-8 shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Domains ({selectedDomains.length})
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDomains.map((domain) => {
                const Icon = domainIcons[domain.domain_name] || Code;
                return (
                  <div key={domain.domain_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Icon className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">{domain.domain_name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={handleContinue}
            disabled={selectedDomains.length === 0}
            className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
              selectedDomains.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue to Assessment
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          
          {selectedDomains.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Please select at least one domain to continue
            </p>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-6 mt-12"
        >
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Target className="w-8 h-8 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Tier-Based System</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Get placed in tiers based on your performance. Higher tiers get better opportunities and visibility.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Trophy className="w-8 h-8 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Regular Contests</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Participate in shifting contests every 4 weeks and internal contests twice a week to improve your ranking.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Fair Opportunities</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Recruiters access candidates based on their tier level, ensuring fair and merit-based hiring.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DomainSelection;
