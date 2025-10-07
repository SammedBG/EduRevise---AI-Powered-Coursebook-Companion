import React, { useState, useEffect } from 'react';
import { FiFileText, FiTrash2, FiSearch, FiEye, FiX, FiBookOpen, FiUpload } from 'react-icons/fi';
import { pdfAPI } from '../../services/api';
// import PDFViewer from './PDFViewer';
import toast from 'react-hot-toast';

const PDFManager = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await pdfAPI.getAll();
      setPdfs(response.data.pdfs);
    } catch (error) {
      toast.error('Failed to load PDFs');
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      await pdfAPI.upload(formData);
      toast.success('PDF uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      fetchPDFs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      await pdfAPI.delete(pdfId);
      toast.success('PDF deleted successfully');
      fetchPDFs();
    } catch (error) {
      toast.error('Failed to delete PDF');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPDFs();
      return;
    }

    try {
      const response = await pdfAPI.search(searchQuery);
      setPdfs(response.data.pdfs);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleProcess = async (pdfId) => {
    try {
      await pdfAPI.process(pdfId);
      toast.success('PDF processed successfully');
      fetchPDFs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process PDF');
    }
  };

  const handleViewPDF = (pdf) => {
    setSelectedPdf(pdf);
    setShowViewer(true);
  };

  const closeViewer = () => {
    setShowViewer(false);
    setSelectedPdf(null);
  };

  const toId = (pdf) => pdf.id || pdf._id;
  const filteredPDFs = pdfs.filter(pdf =>
    (pdf.originalName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your study materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${showViewer ? 'flex' : ''} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
      {/* Main Content */}
      <div className={`${showViewer ? 'w-1/2 pr-4' : 'w-full'}`}>
        {/* Header */}
        <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FiBookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Study Materials</h1>
              <p className="mt-1 text-gray-600">
                Upload and manage your PDF coursebooks and study materials
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FiUpload className="h-5 w-5" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search PDFs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm"
          />
        </div>
      </div>

      {/* PDF Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPDFs.map((pdf) => (
          <div key={toId(pdf)} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FiFileText className="h-6 w-6 text-red-600" />
                </div>
                <button
                  onClick={() => handleDelete(toId(pdf))}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {pdf.originalName}
                </h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Size: {(pdf.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <p>Pages: {pdf.metadata?.pages || 'Unknown'}</p>
                  <p>Uploaded: {new Date(pdf.uploadDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => handleViewPDF(pdf)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 shadow-md hover:shadow-lg"
                >
                  <FiEye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleProcess(toId(pdf))}
                  disabled={pdf.content?.processed}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                    pdf.content?.processed
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {pdf.content?.processed ? 'Processed' : 'Process'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPDFs.length === 0 && (
        <div className="text-center py-12">
          <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No PDFs found' : 'No study materials yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Upload your first PDF to get started with your learning journey'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Upload Your First PDF
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* PDF Viewer */}
      {showViewer && selectedPdf && (
        <div className="w-1/2 pl-4">
          <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
            {/* Viewer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {selectedPdf.originalName}
              </h3>
              <button
                onClick={closeViewer}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-gray-100 rounded-lg">
              {(() => {
                const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const serverOrigin = apiBase.replace(/\/?api\/?$/, '');
                const pdfUrl = `${serverOrigin}/uploads/pdfs/${selectedPdf.filename}`;
                
                return (
                  <div className="w-full h-full flex flex-col">
                    {/* PDF Viewer Options */}
                    <div className="p-3 bg-white border-b flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          <strong>File:</strong> {selectedPdf.originalName}
                        </span>
                        <span className="text-xs text-gray-500">
                          Size: {Math.round(selectedPdf.size / 1024)} KB
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a 
                          href={pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors duration-200"
                        >
                          Open in New Tab
                        </a>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = pdfUrl;
                            link.download = selectedPdf.originalName;
                            link.click();
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                    
                    {/* PDF Viewer Container */}
                    <div className="flex-1 relative">
                      {/* Browser PDF Viewer */}
                      <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                        className="absolute inset-0 w-full h-full"
                        title={`PDF Viewer - ${selectedPdf.originalName}`}
                        style={{ 
                          minHeight: '600px',
                          border: 'none'
                        }}
                        onLoad={() => {
                          console.log('PDF iframe loaded successfully');
                        }}
                        onError={(e) => {
                          console.error('PDF iframe error:', e);
                        }}
                      />
                      
                      {/* Alternative PDF Viewer using object tag */}
                      <object
                        data={pdfUrl}
                        type="application/pdf"
                        className="absolute inset-0 w-full h-full hidden"
                        style={{ minHeight: '600px' }}
                        onLoad={() => console.log('PDF object loaded successfully')}
                        onError={(e) => console.error('PDF object error:', e)}
                      >
                        {/* Fallback content */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <div className="text-center p-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FiFileText className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              PDF Preview Not Available
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Your browser doesn't support PDF preview. Please use the buttons above to view or download the PDF.
                            </p>
                            <div className="flex items-center justify-center space-x-3">
                              <a 
                                href={pdfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                              >
                                Open in New Tab
                              </a>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = pdfUrl;
                                  link.download = selectedPdf.originalName;
                                  link.click();
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                              >
                                Download PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </object>
                    </div>
                    
                    {/* PDF Info Footer */}
                    <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>Uploaded:</strong> {new Date(selectedPdf.uploadDate).toLocaleDateString()}
                        </span>
                        <span>
                          <strong>Status:</strong> {selectedPdf.content?.processed ? 'Processed' : 'Processing'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFManager;
