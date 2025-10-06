import React, { useState, useEffect } from 'react';
import { FiYoutube, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { pdfAPI } from '../../services/api';
import YouTubeRecommendations from './YouTubeRecommendations';
import toast from 'react-hot-toast';

const YouTubePage = () => {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPDFs, setSelectedPDFs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPDFs, setFilteredPDFs] = useState([]);

  useEffect(() => {
    fetchPDFs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = pdfs.filter(pdf =>
        pdf.originalName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPDFs(filtered);
    } else {
      setFilteredPDFs(pdfs);
    }
  }, [searchQuery, pdfs]);

  const fetchPDFs = async () => {
    try {
      const response = await pdfAPI.getAll();
      setPdfs(response.data.pdfs);
      setFilteredPDFs(response.data.pdfs);
    } catch (error) {
      toast.error('Failed to load PDFs');
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePDFSelect = (pdfId) => {
    setSelectedPDFs(prev => 
      prev.includes(pdfId) 
        ? prev.filter(id => id !== pdfId)
        : [...prev, pdfId]
    );
  };

  const selectAllPDFs = () => {
    setSelectedPDFs(filteredPDFs.map(pdf => pdf.id));
  };

  const clearSelection = () => {
    setSelectedPDFs([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FiYoutube className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Recommendations</h1>
            <p className="mt-2 text-gray-600">
              Discover educational videos related to your study materials
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search your study materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={selectAllPDFs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
            >
              <FiFilter className="h-4 w-4 mr-2" />
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Clear
            </button>
            <button
              onClick={fetchPDFs}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PDF Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Study Materials ({selectedPDFs.length} selected)
            </h3>
            
            {filteredPDFs.length === 0 ? (
              <div className="text-center py-8">
                <FiYoutube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No study materials found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload some PDFs to get video recommendations
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPDFs.map((pdf) => (
                  <label key={pdf.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPDFs.includes(pdf.id)}
                      onChange={() => handlePDFSelect(pdf.id)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {pdf.originalName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {pdf.metadata?.pages || 'Unknown'} pages • 
                        {(pdf.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video Recommendations */}
        <div className="lg:col-span-2">
          {selectedPDFs.length > 0 ? (
            <YouTubeRecommendations 
              pdfIds={selectedPDFs} 
              maxResults={6}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <FiYoutube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select Study Materials
                </h3>
                <p className="text-gray-500 mb-4">
                  Choose one or more PDFs to get personalized video recommendations
                </p>
                <div className="text-sm text-gray-400">
                  <p>• Videos are matched based on content analysis</p>
                  <p>• Recommendations include tutorials and explanations</p>
                  <p>• All videos are educational and relevant to your studies</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {selectedPDFs.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedPDFs.length}</div>
              <div className="text-sm text-gray-500">Selected Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedPDFs.length * 3}
              </div>
              <div className="text-sm text-gray-500">Expected Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(selectedPDFs.length * 15)}
              </div>
              <div className="text-sm text-gray-500">Minutes of Content</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePage;
