const { pool } = require('./db/database');

async function getShelfCounts(userId) {
  try {
    const result = await pool.query(
      `SELECT exclusive_shelf, COUNT(*) 
       FROM books 
       WHERE user_id = $1 
       GROUP BY exclusive_shelf`,
      [userId]
    );
    
    const shelfCounts = result.rows.reduce((acc, row) => {
      acc[row.exclusive_shelf] = parseInt(row.count);
      return acc;
    }, {});
    
    // Add default values if no books are found
    if (Object.keys(shelfCounts).length === 0) {
      shelfCounts['read'] = 0;
      shelfCounts['currently-reading'] = 0;
      shelfCounts['to-read'] = 0;
    }
    
    return shelfCounts;
  } catch (error) {
    console.error('Error fetching shelf counts:', error);
    throw error;
  }
}

module.exports = { getShelfCounts };