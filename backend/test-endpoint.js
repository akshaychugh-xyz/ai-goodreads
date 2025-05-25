require('dotenv').config();
process.env.USE_SUPABASE = 'true';

const express = require('express');
const { pool } = require('./db/database-switcher');

// Copy the functions from recommendations.js
async function getMostReadAuthor(userId) {
  const result = await pool.query(`
    SELECT 
      author,
      COUNT(*) as read_count
    FROM books 
    WHERE user_id = $1
      AND exclusive_shelf = 'read'
      AND author IS NOT NULL 
      AND author != ''
    GROUP BY author
    ORDER BY read_count DESC
    LIMIT 1
  `, [userId]);
  
  return {
    name: result.rows[0]?.author || 'None',
    count: parseInt(result.rows[0]?.read_count) || 0
  };
}

async function getUserReadingData(userId) {
  try {
    console.log('Connected to database');
    
    // Fetch total books read
    console.log('Fetching total books read');
    const totalBooksResult = await pool.query(
      'SELECT COUNT(*) FROM books WHERE user_id = $1 AND exclusive_shelf = $2',
      [userId, 'read']
    );
    const totalBooks = parseInt(totalBooksResult.rows[0].count);
    console.log('Total books result:', totalBooks);

    // Fetch top 3 authors
    console.log('Fetching top authors');
    const topAuthorsResult = await pool.query(
      'SELECT author, COUNT(*) FROM books WHERE user_id = $1 AND author IS NOT NULL AND author != \'\' GROUP BY author ORDER BY COUNT(*) DESC LIMIT 3',
      [userId]
    );
    const topAuthors = topAuthorsResult.rows.map(row => row.author);
    console.log('Top authors:', topAuthors);

    // Fetch longest book read
    console.log('Fetching longest book');
    const longestBookResult = await pool.query(
      'SELECT title, number_of_pages FROM books WHERE user_id = $1 AND exclusive_shelf = $2 ORDER BY number_of_pages DESC NULLS LAST LIMIT 1',
      [userId, 'read']
    );
    const longestBook = longestBookResult.rows[0] || { title: 'N/A', number_of_pages: 0 };
    console.log('Longest book:', longestBook);

    // Fetch most read author
    console.log('Fetching most read author');
    const mostReadAuthor = await getMostReadAuthor(userId);
    console.log('Most read author:', mostReadAuthor);

    return {
      totalBooks,
      topAuthors,
      longestBook,
      mostReadAuthor
    };
  } catch (error) {
    console.error('Error in getUserReadingData:', error);
    throw error;
  }
}

function generateFallbackSummary(userData) {
  const { totalBooks, topAuthors, longestBook, mostReadAuthor } = userData;
  
  let summary = "📚 **Your Reading Journey**\n\n";
  
  // Reading volume
  if (totalBooks === 0) {
    summary += "You're just getting started on your reading adventure! Every great reader begins with their first book.\n\n";
  } else if (totalBooks < 5) {
    summary += `You've read ${totalBooks} book${totalBooks > 1 ? 's' : ''} - a solid start to your reading journey! `;
  } else if (totalBooks < 15) {
    summary += `With ${totalBooks} books under your belt, you're developing a nice reading habit! `;
  } else if (totalBooks < 30) {
    summary += `${totalBooks} books read - you're becoming quite the bookworm! `;
  } else if (totalBooks < 50) {
    summary += `Impressive! ${totalBooks} books shows serious dedication to reading. `;
  } else {
    summary += `Wow! ${totalBooks} books read - you're a true bibliophile! `;
  }
  
  // Author preferences
  if (mostReadAuthor.name !== 'None' && mostReadAuthor.count > 1) {
    summary += `You seem to have found a favorite in ${mostReadAuthor.name}, having read ${mostReadAuthor.count} of their works. `;
  }
  
  if (topAuthors.length > 0 && topAuthors[0]) {
    const uniqueAuthors = [...new Set(topAuthors.filter(author => author))];
    if (uniqueAuthors.length > 1) {
      summary += `Your reading spans diverse voices including ${uniqueAuthors.slice(0, 3).join(', ')}. `;
    }
  }
  
  // Book length preferences
  if (longestBook.title !== 'N/A' && longestBook.number_of_pages > 0) {
    if (longestBook.number_of_pages > 600) {
      summary += `You're not afraid of epic reads - tackling "${longestBook.title}" at ${longestBook.number_of_pages} pages shows real commitment! `;
    } else if (longestBook.number_of_pages > 400) {
      summary += `"${longestBook.title}" (${longestBook.number_of_pages} pages) shows you enjoy substantial stories. `;
    }
  }
  
  // Motivational ending
  summary += "\n\n";
  if (totalBooks < 10) {
    summary += "🌟 Keep exploring new worlds through books - your reading adventure is just beginning!";
  } else if (totalBooks < 25) {
    summary += "🌟 You're building an impressive reading foundation. Consider exploring new genres to broaden your literary horizons!";
  } else {
    summary += "🌟 Your reading journey reflects a true love of literature. You're an inspiration to fellow book lovers!";
  }
  
  return summary;
}

async function testEndpointLogic() {
  try {
    console.log('Testing endpoint logic...');
    
    const userId = 1; // Demo user
    console.log('Generate summary called for user:', userId);
    
    console.log('About to call getUserReadingData...');
    const userData = await getUserReadingData(userId);
    console.log('getUserReadingData completed successfully:', userData);
    
    console.log('Generating fallback summary...');
    const summary = generateFallbackSummary(userData);
    console.log('Generated fallback summary successfully');
    
    console.log('Final result:');
    console.log(JSON.stringify({ summary }, null, 2));
    
    console.log('✅ Endpoint logic test successful!');
  } catch (error) {
    console.error('❌ Endpoint logic test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testEndpointLogic(); 