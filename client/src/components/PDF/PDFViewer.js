import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ fileUrl, initialPage = 1, onPageChange }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage);

  useEffect(() => {
    setPageNumber(initialPage);
  }, [initialPage]);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
  };

  const goToPrev = () => {
    setPageNumber((p) => {
      const next = Math.max(1, p - 1);
      onPageChange && onPageChange(next);
      return next;
    });
  };

  const goToNext = () => {
    setPageNumber((p) => {
      const next = Math.min(numPages || p + 1, p + 1);
      onPageChange && onPageChange(next);
      return next;
    });
  };

  if (!fileUrl) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        Select a PDF to preview
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-white">
        <button onClick={goToPrev} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Prev</button>
        <div className="text-sm text-gray-600">
          Page {pageNumber}{numPages ? ` / ${numPages}` : ''}
        </div>
        <button onClick={goToNext} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Next</button>
      </div>
      <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="spinner" />}>
          <Page pageNumber={pageNumber} width={600} renderTextLayer renderAnnotationLayer />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;


