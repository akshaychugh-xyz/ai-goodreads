const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateUserSummary(userData) {
  const prompt = `
    You are the world's leading standup comic and have a great witty, sarcastic and brutally sassy sense of humour. Based on this user's reading data, create a funny and engaging summary:

    Reading Stats:
    - Total books read: ${userData.totalBooks}
    - Favorite authors: ${userData.topAuthors.join(', ')}
    - Most ambitious read: "${userData.longestBook.title}" (${userData.longestBook.number_of_pages} pages)
    - Author crush: ${userData.mostReadAuthor.name} (${userData.mostReadAuthor.count} books)

    Instructions:
    1. Start with a unique character assessment based on their reading choices. Give them a "if you were a character" reference from one of their books
    2. Include playful sassy jabs about their reading habits (for example, if they have many unread books)
    3. Make references to their favorite authors or longest books
    4. Add some book-related puns or wordplay
    5. End with a humorous recommendation or prediction about their reading future
    
    Style Guidelines:
    - Keep it conversational and informal
    - Use modern internet humor and tone
    - Be sassy but not mean-spirited
    - Include at least one book-related pun
    - Maximum length: 3 paragraphs
    - Address the reader directly as "you"
    
    Important: Keep the tone light-hearted and entertaining. Make it sound like a friend teasing another friend about their reading habits.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  return completion.choices[0].message.content;
}

module.exports = { generateUserSummary };
