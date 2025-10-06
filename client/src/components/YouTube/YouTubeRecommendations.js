import React, { useState, useEffect } from 'react';
import { FiYoutube, FiPlay, FiClock, FiEye, FiExternalLink } from 'react-icons/fi';
import { youtubeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const YouTubeRecommendations = ({ pdfIds, maxResults = 5 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pdfIds && pdfIds.length > 0) {
      fetchRecommendations();
    }
  }, [pdfIds, maxResults]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (pdfIds.length === 1) {
        response = await youtubeAPI.getRecommendations(pdfIds[0], maxResults);
      } else {
        response = await youtubeAPI.getBatchRecommendations(pdfIds, maxResults);
      }

      setRecommendations(response.data.recommendations || []);
      
      if (response.data.note) {
        toast.info('Using demo YouTube recommendations');
      }
    } catch (error) {
      console.error('Error fetching YouTube recommendations:', error);
      setError('Failed to load video recommendations');
      toast.error('Failed to load video recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (publishedAt) => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FiYoutube className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended Videos</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-40 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FiYoutube className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended Videos</h3>
        </div>
        <div className="text-center py-8">
          <FiYoutube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FiYoutube className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended Videos</h3>
        </div>
        <div className="text-center py-8">
          <FiYoutube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No video recommendations available</p>
          <p className="text-sm text-gray-400 mt-2">
            Upload and process some PDFs to get relevant video suggestions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FiYoutube className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended Videos</h3>
        </div>
        <button
          onClick={fetchRecommendations}
          className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map((video, index) => (
          <div
            key={video.videoId || index}
            className="flex space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-40 h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/160x90?text=Video';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-70 rounded-full p-2">
                  <FiPlay className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                {video.title}
              </h4>
              
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {truncateText(video.description, 150)}
              </p>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <FiEye className="h-3 w-3 mr-1" />
                  {video.channelTitle}
                </span>
                <span className="flex items-center">
                  <FiClock className="h-3 w-3 mr-1" />
                  {formatDuration(video.publishedAt)}
                </span>
              </div>

              {video.searchQuery && (
                <div className="mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {video.searchQuery}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <FiExternalLink className="h-3 w-3 mr-1" />
                Watch
              </a>
              
              <button
                onClick={() => window.open(video.url, '_blank')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs font-medium transition-colors duration-200"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Video recommendations based on your study materials • Powered by YouTube
        </p>
      </div>
    </div>
  );
};

export default YouTubeRecommendations;
