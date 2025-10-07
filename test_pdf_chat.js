const mongoose = require('mongoose');
const PDF = require('./models/PDF');
require('dotenv').config();

async function testPDFChat() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-buddy');
    console.log('Connected to MongoDB');

    // Find a PDF with content
    const pdfs = await PDF.find({
      'content.extractedText': { $exists: true, $ne: '' }
    }).limit(5);

    console.log(`\nFound ${pdfs.length} PDFs with extracted text:`);
    
    for (const pdf of pdfs) {
      console.log(`\n--- PDF: ${pdf.originalName} ---`);
      console.log(`ID: ${pdf._id}`);
      console.log(`Processed: ${pdf.content?.processed || false}`);
      console.log(`Has chunks: ${pdf.content?.chunks ? pdf.content.chunks.length : 0}`);
      console.log(`Text length: ${pdf.content?.extractedText?.length || 0} characters`);
      console.log(`Text preview: ${pdf.content?.extractedText?.substring(0, 200)}...`);
    }

    if (pdfs.length > 0) {
      const testPdf = pdfs[0];
      console.log(`\n--- Testing context retrieval for: ${testPdf.originalName} ---`);
      
      // Test the getRelevantContext function
      const { getRelevantContext } = require('./routes/chat');
      
      const testQueries = [
        'physics',
        'kinematics', 
        'what is',
        'explain',
        'how does'
      ];

      for (const query of testQueries) {
        console.log(`\nQuery: "${query}"`);
        try {
          const context = await getRelevantContext(query, [testPdf._id]);
          console.log(`Found ${context.length} relevant chunks`);
          
          if (context.length > 0) {
            console.log(`Best match: ${context[0].text.substring(0, 100)}...`);
            console.log(`Relevance score: ${context[0].relevanceScore}`);
          }
        } catch (error) {
          console.error(`Error testing query "${query}":`, error.message);
        }
      }
    }

    console.log('\n--- PDF Chat Test Complete ---');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testPDFChat();