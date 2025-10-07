import React, { useState, useEffect } from 'react';
import { FiPlay, FiCheck, FiHelpCircle, FiFileText, FiBookOpen, FiTarget, FiRefreshCw } from 'react-icons/fi';
import { quizAPI, pdfAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Quiz = () => {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPDFs, setSelectedPDFs] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sourceMode, setSourceMode] = useState('all'); // 'all' | 'specific'

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await pdfAPI.getAll();
      setPdfs(response.data.pdfs);
    } catch (error) {
      toast.error('Failed to load PDFs');
    }
  };

  const handlePDFSelect = (pdfId) => {
    setSelectedPDFs(prev => 
      prev.includes(pdfId) 
        ? prev.filter(id => id !== pdfId)
        : [...prev, pdfId]
    );
  };

  const generateQuiz = async () => {
    if (selectedPDFs.length === 0) {
      toast.error('Please select at least one PDF');
      return;
    }

    setLoading(true);
    try {
      const response = await quizAPI.generate({
        pdfIds: selectedPDFs,
        difficulty: 'mixed',
        questionTypes: ['mcq', 'saq', 'laq'],
        numQuestions: 10
      });
      setQuiz(response.data.quiz);
      setQuizStarted(true);
      toast.success('Quiz generated successfully!');
    } catch (error) {
      toast.error('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      const response = await quizAPI.submit(quiz._id, {
        answers: Object.values(answers),
        timeSpent: 10 // Mock time spent
      });
      setResults(response.data.results);
      setQuizCompleted(true);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setAnswers({});
    setCurrentQuestion(0);
    setQuizStarted(false);
    setQuizCompleted(false);
    setResults(null);
    setSelectedPDFs([]);
  };

  if (!quizStarted && !quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <FiTarget className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Practice Quiz</h1>
          <p className="text-gray-600 text-lg">
            Select your study materials and generate a personalized quiz to test your knowledge
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select PDFs</h2>

          {/* Source selector */}
          <div className="flex items-center space-x-3 mb-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="h-4 w-4 text-blue-600"
                checked={sourceMode === 'all'}
                onChange={() => setSourceMode('all')}
              />
              <span className="ml-2 text-sm text-gray-700">All uploaded PDFs</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="h-4 w-4 text-blue-600"
                checked={sourceMode === 'specific'}
                onChange={() => setSourceMode('specific')}
              />
              <span className="ml-2 text-sm text-gray-700">Specific PDFs</span>
            </label>
          </div>
          
          {pdfs.length === 0 ? (
            <div className="text-center py-8">
              <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No PDFs available</p>
              <p className="text-sm text-gray-400">
                Upload some study materials first to generate quizzes
              </p>
            </div>
          ) : (
            <>
              {sourceMode === 'specific' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {pdfs.map((pdf) => (
                  <label key={pdf.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPDFs.includes(pdf._id || pdf.id)}
                      onChange={() => handlePDFSelect(pdf._id || pdf.id)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{pdf.originalName}</h3>
                      <p className="text-sm text-gray-500">
                        {pdf.metadata?.pages || 'Unknown'} pages
                      </p>
                    </div>
                  </label>
                  ))}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const ids = sourceMode === 'all' ? pdfs.map(p => p._id || p.id) : selectedPDFs;
                    setSelectedPDFs(ids);
                    generateQuiz();
                  }}
                  disabled={(sourceMode === 'specific' && selectedPDFs.length === 0) || loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiPlay className="h-6 w-6" />
                  )}
                  <span>{loading ? 'Generating Quiz...' : 'Generate Quiz'}</span>
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    );
  }

  if (quizCompleted && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 pt-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <FiCheck className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
            <p className="text-gray-600">Here are your detailed results</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-blue-600">{results.correctAnswers}</h3>
              <p className="text-blue-800">Correct Answers</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-green-600">{results.percentage}%</h3>
              <p className="text-green-800">Score</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-purple-600">{results.totalQuestions}</h3>
              <p className="text-purple-800">Total Questions</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-orange-600">{results.earnedPoints || 0}</h3>
              <p className="text-orange-800">Points Earned</p>
            </div>
          </div>

          {/* Detailed Question Results */}
          {results.questionResults && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Question Review</h2>
              <div className="space-y-6">
                {results.questionResults.map((questionResult, index) => (
                  <div key={index} className={`border rounded-lg p-6 ${
                    questionResult.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          questionResult.isCorrect 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {questionResult.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                          {questionResult.type.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded">
                          {questionResult.difficulty}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {questionResult.score}/{questionResult.maxScore}
                        </span>
                        <p className="text-sm text-gray-500">points</p>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Q{index + 1}: {questionResult.question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Your Answer:</h4>
                        <p className="text-gray-600 bg-white p-3 rounded border">
                          {questionResult.userAnswer || 'No answer provided'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Correct Answer:</h4>
                        <p className="text-gray-600 bg-white p-3 rounded border">
                          {questionResult.correctAnswer}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Feedback:</h4>
                      <p className={`p-3 rounded ${
                        questionResult.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {questionResult.feedback}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Explanation:</h4>
                      <p className="text-gray-600 bg-white p-3 rounded border">
                        {questionResult.explanation}
                      </p>
                    </div>

                    {questionResult.source && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">Source Reference:</h4>
                        <p className="text-sm text-gray-500 italic">
                          Page {questionResult.source.pageNumber}: "{questionResult.source.snippet}..."
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetQuiz}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Take Another Quiz
            </button>
            {quiz && (
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await quizAPI.regenerate(quiz._id, {
                      difficulty: 'mixed',
                      questionTypes: ['mcq', 'saq', 'laq'],
                      numQuestions: 10
                    });
                    setQuiz(response.data.quiz);
                    setQuizStarted(true);
                    setQuizCompleted(false);
                    setResults(null);
                    setAnswers({});
                    setCurrentQuestion(0);
                    toast.success('New quiz generated!');
                  } catch (error) {
                    toast.error('Failed to generate new quiz');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <FiPlay className="h-5 w-5" />
                <span>Generate New Questions</span>
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (quiz && quizStarted) {
    const question = quiz.questions[currentQuestion];
    const isLastQuestion = currentQuestion === quiz.questions.length - 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <FiHelpCircle className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                {question.type.toUpperCase()}
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {question.question}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3">
              {question.type === 'mcq' && question.options ? (
                question.options.map((option, index) => (
                  <label key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={answers[currentQuestion] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-900">{option}</span>
                  </label>
                ))
              ) : (
                <textarea
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                  placeholder={question.type === 'saq' ? 'Enter your short answer...' : 'Enter your detailed answer...'}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={question.type === 'laq' ? 6 : 3}
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {isLastQuestion ? (
                <button
                  onClick={submitQuiz}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <FiCheck className="h-5 w-5" />
                  <span>Submit Quiz</span>
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Quiz;
