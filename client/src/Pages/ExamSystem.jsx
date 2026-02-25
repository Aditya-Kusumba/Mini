import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../axiosConfig';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Send
} from 'lucide-react';

const ExamSystem = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  useEffect(() => {
    let interval = null;
    if (isStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, timeLeft]);

  const fetchExamDetails = async () => {
    try {
      const response = await api.get(`/api/exams/${examId}`);
      setExam(response.data.exam);
      setQuestions(response.data.questions || []);
      
      if (response.data.hasAttempted) {
        // Load previous attempt
        const previousAttempt = response.data.previousAttempts[0];
        if (previousAttempt.status === 'COMPLETED') {
          setIsCompleted(true);
        } else {
          setAnswers(previousAttempt.answers || {});
          setCurrentQuestionIndex(Object.keys(previousAttempt.answers || {}).length);
        }
      }
    } catch (error) {
      console.error('Error fetching exam details:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async () => {
    try {
      setSubmitting(true);
      const response = await api.post(`/api/exams/${examId}/start`);
      setExam(response.data.exam);
      setQuestions(response.data.questions);
      setTimeLeft(response.data.time_limit);
      setIsStarted(true);
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Failed to start exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (questionId, answer) => {
    try {
      const response = await api.post(`/api/exams/attempt/${exam.attempt_id}/answer`, {
        questionId,
        answer
      });
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          answer,
          isCorrect: response.data.isCorrect,
          pointsEarned: response.data.pointsEarned
        }
      }));
      
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      return null;
    }
  };

  const handleAnswerChange = async (questionId, answer) => {
    // For multiple choice, submit immediately
    if (questions[currentQuestionIndex]?.question_type === 'MULTIPLE_CHOICE') {
      await submitAnswer(questionId, answer);
    } else {
      // For coding questions, just store locally
      setAnswers(prev => ({
        ...prev,
        [questionId]: { answer }
      }));
    }
  };

  const handleNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Submit current answer if it's a coding question
    if (currentQuestion.question_type === 'CODING' || currentQuestion.question_type === 'SQL') {
      const answer = answers[currentQuestion.question_id]?.answer;
      if (answer) {
        await submitAnswer(currentQuestion.question_id, answer);
      }
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteExam = async () => {
    try {
      setSubmitting(true);
      const response = await api.post(`/api/exams/attempt/${exam.attempt_id}/complete`);
      setIsCompleted(true);
      setExam(response.data.attempt);
    } catch (error) {
      console.error('Error completing exam:', error);
      alert('Failed to complete exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    await handleCompleteExam();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(answers).length;
    return (answeredQuestions / questions.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-4">The exam you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isStarted && !isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{exam.exam_name}</h1>
            <p className="text-gray-600 mb-6">{exam.description}</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Clock className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Duration</h3>
                <p className="text-gray-600">{exam.duration_minutes} minutes</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <CheckCircle className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Questions</h3>
                <p className="text-gray-600">{exam.total_questions} questions</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> Once you start the exam, the timer will begin and cannot be paused. 
                  Make sure you're ready before starting.
                </p>
              </div>
            </div>
            
            <button
              onClick={startExam}
              disabled={submitting}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center mx-auto"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Exam
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Exam Completed!</h1>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Score</h3>
                <p className="text-2xl font-bold text-indigo-600">{exam.percentage?.toFixed(1)}%</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Status</h3>
                <p className={`text-lg font-semibold ${exam.percentage >= exam.passing_score ? 'text-green-600' : 'text-red-600'}`}>
                  {exam.percentage >= exam.passing_score ? 'Passed' : 'Failed'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Time Taken</h3>
                <p className="text-lg font-semibold text-gray-600">{exam.time_taken_minutes?.toFixed(1)} min</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.question_id];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">{exam.exam_name}</h1>
              <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Progress: {Object.keys(answers).length}/{questions.length}
              </div>
              <div className={`flex items-center ${timeLeft < 300 ? 'text-red-600' : 'text-gray-600'}`}>
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                {questions.map((question, index) => {
                  const isAnswered = answers[question.question_id];
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.question_id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm p-8"
              >
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Question {currentQuestionIndex + 1}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentQuestion.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                      currentQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-6">{currentQuestion.question_text}</p>
                </div>

                {/* Answer Input */}
                <div className="mb-8">
                  {currentQuestion.question_type === 'MULTIPLE_CHOICE' ? (
                    <div className="space-y-3">
                      {JSON.parse(currentQuestion.options).map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            currentAnswer?.answer === option
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.question_id}`}
                            value={option}
                            checked={currentAnswer?.answer === option}
                            onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            currentAnswer?.answer === option
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-300'
                          }`}>
                            {currentAnswer?.answer === option && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={currentAnswer?.answer || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                        placeholder="Enter your answer here..."
                        className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>

                  <div className="flex space-x-4">
                    {currentQuestionIndex === questions.length - 1 ? (
                      <button
                        onClick={handleCompleteExam}
                        disabled={submitting}
                        className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Exam
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSystem;
