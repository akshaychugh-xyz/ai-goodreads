const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateUserSummary(userData) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Based on the following user's reading habits, create a sassy and funny summary:
    Total books read: ${userData.totalBooks}
    Top authors: ${userData.topAuthors.join(', ')}
    Longest book read: "${userData.longestBook.title}" (${userData.longestBook.number_of_pages} pages)
    Most read author: ${userData.mostReadAuthor}

    Please create a humorous, slightly sarcastic summary of this user's reading habits. 
    Keep it light-hearted and entertaining, with a touch of playful mockery.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { generateUserSummary };
