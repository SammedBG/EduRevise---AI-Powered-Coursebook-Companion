const mongoose = require('mongoose');
const axios = require('axios');
const PDF = require('./models/PDF');

// Helper functions from pdfs.js
async function generateEmbedding(text) {
  try {
    if (process.env.GROQ_API_KEY) {
      const response = await axios.post('https://api.groq.com/openai/v1/embeddings', {
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.data && response.data.data[0]) {
        return response.data.data[0].embedding;
      }
    }
    
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post('https://api.openai.com/v1/embeddings', {
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.data && response.data.data[0]) {
        return response.data.data[0].embedding;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function testEnhancedRAG() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-buddy');
    console.log('✅ Connected to MongoDB');

    // Check if we have PDFs with embeddings
    const pdfsWithEmbeddings = await PDF.find({
      'content.hasEmbeddings': true,
      'content.chunks.embedding': { $exists: true, $not: { $size: 0 } }
    });

    console.log(`\n📊 Found ${pdfsWithEmbeddings.length} PDFs with embeddings`);

    if (pdfsWithEmbeddings.length === 0) {
      console.log('❌ No PDFs with embeddings found. Please process some PDFs first.');
      return;
    }

    // Test query embedding generation
    const testQuery = "What is physics and how does it relate to motion?";
    console.log(`\n🔍 Testing query: "${testQuery}"`);
    
    const queryEmbedding = await generateEmbedding(testQuery);
    if (queryEmbedding && queryEmbedding.length > 0) {
      console.log(`✅ Query embedding generated (${queryEmbedding.length} dimensions)`);
    } else {
      console.log('❌ Failed to generate query embedding');
      return;
    }

    // Test semantic search
    console.log('\n🎯 Testing semantic search...');
    let bestMatches = [];

    for (const pdf of pdfsWithEmbeddings) {
      if (pdf.content.chunks) {
        for (const chunk of pdf.content.chunks) {
          if (chunk.embedding && chunk.embedding.length > 0) {
            const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
            
            bestMatches.push({
              pdfName: pdf.originalName,
              pageNumber: chunk.pageNumber,
              similarity: similarity,
              text: chunk.text.substring(0, 100) + '...',
              keywordScore: 0 // We'll calculate this separately
            });
          }
        }
      }
    }

    // Sort by similarity and show top results
    bestMatches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = bestMatches.slice(0, 5);

    console.log('\n🏆 Top 5 semantic matches:');
    topMatches.forEach((match, index) => {
      console.log(`\n${index + 1}. PDF: ${match.pdfName}`);
      console.log(`   Page: ${match.pageNumber}`);
      console.log(`   Similarity: ${Math.round(match.similarity * 100)}%`);
      console.log(`   Text: "${match.text}"`);
    });

    // Test hybrid search scoring
    console.log('\n🔄 Testing hybrid search scoring...');
    const hybridResults = bestMatches.map(match => {
      // Simulate keyword score (in real implementation, this would be calculated)
      const keywordScore = Math.random() * 3; // 0-3 range
      const hybridScore = (match.similarity * 0.7) + (keywordScore * 0.3);
      
      return {
        ...match,
        keywordScore: keywordScore,
        hybridScore: hybridScore
      };
    });

    hybridResults.sort((a, b) => b.hybridScore - a.hybridScore);
    const topHybrid = hybridResults.slice(0, 3);

    console.log('\n🎯 Top 3 hybrid search results:');
    topHybrid.forEach((result, index) => {
      console.log(`\n${index + 1}. PDF: ${result.pdfName}`);
      console.log(`   Page: ${result.pageNumber}`);
      console.log(`   Semantic: ${Math.round(result.similarity * 100)}%`);
      console.log(`   Keyword: ${Math.round(result.keywordScore)}`);
      console.log(`   Hybrid: ${Math.round(result.hybridScore * 100)}%`);
    });

    console.log('\n✅ Enhanced RAG testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testEnhancedRAG();
