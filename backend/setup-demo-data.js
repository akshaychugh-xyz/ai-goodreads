require('dotenv').config();

// Script to set up demo data for User ID 1
async function setupDemoData() {
  console.log('Setting up demo data for BetterReads...');
  
  // Force use of Supabase for demo data
  process.env.USE_SUPABASE = 'true';
  
  try {
    const { pool } = require('./db/database-switcher');
    
    console.log('1. Creating demo user...');
    
    // Create demo user (ID 1)
    try {
      await pool.query(
        'INSERT INTO users (id, email, password, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [1, 'demo@betterreads.com', 'demo-password', new Date()]
      );
      console.log('✅ Demo user created/exists');
    } catch (error) {
      console.log('Demo user might already exist:', error.message);
    }
    
    console.log('2. Adding demo books...');
    
    // Demo books data
    const demoBooks = [
      {
        book_id: 'demo-1',
        title: 'The Midnight Library',
        author: 'Matt Haig',
        isbn: '9781786892737',
        average_rating: 4.2,
        number_of_pages: 288,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2024-01-01',
        date_read: '2024-01-15',
        my_review: 'Absolutely loved this philosophical journey!'
      },
      {
        book_id: 'demo-2',
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '9780735211292',
        average_rating: 4.4,
        number_of_pages: 320,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2024-02-01',
        date_read: '2024-02-20',
        my_review: 'Great practical advice for building better habits.'
      },
      {
        book_id: 'demo-3',
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '9780441172719',
        average_rating: 4.3,
        number_of_pages: 688,
        exclusive_shelf: 'currently-reading',
        my_rating: null,
        date_added: '2024-03-01',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-4',
        title: 'The Seven Husbands of Evelyn Hugo',
        author: 'Taylor Jenkins Reid',
        isbn: '9781501161933',
        average_rating: 4.3,
        number_of_pages: 400,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-03-15',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-5',
        title: 'Educated',
        author: 'Tara Westover',
        isbn: '9780399590504',
        average_rating: 4.5,
        number_of_pages: 334,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2024-01-20',
        date_read: '2024-02-05',
        my_review: 'Powerful memoir about education and family.'
      },
      {
        book_id: 'demo-6',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        isbn: '9780593135204',
        average_rating: 4.5,
        number_of_pages: 496,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-03-20',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-7',
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        isbn: '9780857197689',
        average_rating: 4.3,
        number_of_pages: 256,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2024-02-10',
        date_read: '2024-02-28',
        my_review: 'Insightful look at financial behavior and decision-making.'
      },
      {
        book_id: 'demo-8',
        title: 'Klara and the Sun',
        author: 'Kazuo Ishiguro',
        isbn: '9780571364886',
        average_rating: 3.9,
        number_of_pages: 320,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-03-25',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-9',
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        isbn: '9781250301697',
        average_rating: 4.1,
        number_of_pages: 336,
        exclusive_shelf: 'read',
        my_rating: 3,
        date_added: '2024-01-10',
        date_read: '2024-01-25',
        my_review: 'Interesting psychological thriller with a twist.'
      },
      {
        book_id: 'demo-10',
        title: 'Circe',
        author: 'Madeline Miller',
        isbn: '9780316556347',
        average_rating: 4.3,
        number_of_pages: 400,
        exclusive_shelf: 'currently-reading',
        my_rating: null,
        date_added: '2024-03-10',
        date_read: null,
        my_review: null
      },
      // Adding 50 more books
      {
        book_id: 'demo-11',
        title: 'The Song of Achilles',
        author: 'Madeline Miller',
        isbn: '9780062060624',
        average_rating: 4.4,
        number_of_pages: 416,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2023-11-01',
        date_read: '2023-11-20',
        my_review: 'Beautiful retelling of Greek mythology.'
      },
      {
        book_id: 'demo-12',
        title: 'Where the Crawdads Sing',
        author: 'Delia Owens',
        isbn: '9780735219090',
        average_rating: 4.2,
        number_of_pages: 384,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2023-10-15',
        date_read: '2023-11-05',
        my_review: 'Captivating mystery with beautiful nature writing.'
      },
      {
        book_id: 'demo-13',
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        isbn: '9780061122415',
        average_rating: 3.9,
        number_of_pages: 163,
        exclusive_shelf: 'read',
        my_rating: 3,
        date_added: '2023-09-01',
        date_read: '2023-09-10',
        my_review: 'Simple but profound philosophical tale.'
      },
      {
        book_id: 'demo-14',
        title: 'The Handmaid\'s Tale',
        author: 'Margaret Atwood',
        isbn: '9780385490818',
        average_rating: 4.1,
        number_of_pages: 311,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2023-08-15',
        date_read: '2023-09-05',
        my_review: 'Chilling dystopian masterpiece.'
      },
      {
        book_id: 'demo-15',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        isbn: '9780062316097',
        average_rating: 4.4,
        number_of_pages: 443,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2023-07-01',
        date_read: '2023-08-10',
        my_review: 'Fascinating look at human history and evolution.'
      },
      {
        book_id: 'demo-16',
        title: 'The Martian',
        author: 'Andy Weir',
        isbn: '9780553418026',
        average_rating: 4.4,
        number_of_pages: 369,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2023-06-15',
        date_read: '2023-07-05',
        my_review: 'Brilliant hard sci-fi with humor and science.'
      },
      {
        book_id: 'demo-17',
        title: 'The Kite Runner',
        author: 'Khaled Hosseini',
        isbn: '9781594631931',
        average_rating: 4.3,
        number_of_pages: 371,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2023-05-01',
        date_read: '2023-06-01',
        my_review: 'Heartbreaking story of friendship and redemption.'
      },
      {
        book_id: 'demo-18',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        average_rating: 3.9,
        number_of_pages: 180,
        exclusive_shelf: 'read',
        my_rating: 3,
        date_added: '2023-04-15',
        date_read: '2023-05-01',
        my_review: 'Classic American literature with beautiful prose.'
      },
      {
        book_id: 'demo-19',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '9780061120084',
        average_rating: 4.3,
        number_of_pages: 376,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2023-03-01',
        date_read: '2023-04-01',
        my_review: 'Timeless story about justice and moral courage.'
      },
      {
        book_id: 'demo-20',
        title: '1984',
        author: 'George Orwell',
        isbn: '9780451524935',
        average_rating: 4.2,
        number_of_pages: 328,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2023-02-15',
        date_read: '2023-03-15',
        my_review: 'Terrifyingly relevant dystopian classic.'
      },
      {
        book_id: 'demo-21',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        isbn: '9780547928227',
        average_rating: 4.3,
        number_of_pages: 366,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2023-01-01',
        date_read: '2023-02-01',
        my_review: 'Delightful adventure that started it all.'
      },
      {
        book_id: 'demo-22',
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        isbn: '9780544003415',
        average_rating: 4.5,
        number_of_pages: 1216,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2022-12-01',
        date_read: '2023-01-30',
        my_review: 'Epic fantasy masterpiece that defined the genre.'
      },
      {
        book_id: 'demo-23',
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        isbn: '9780439708180',
        average_rating: 4.5,
        number_of_pages: 309,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2022-11-01',
        date_read: '2022-11-15',
        my_review: 'Magical beginning to an incredible series.'
      },
      {
        book_id: 'demo-24',
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        isbn: '9780316769174',
        average_rating: 3.8,
        number_of_pages: 277,
        exclusive_shelf: 'read',
        my_rating: 3,
        date_added: '2022-10-15',
        date_read: '2022-11-01',
        my_review: 'Controversial but influential coming-of-age story.'
      },
      {
        book_id: 'demo-25',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        isbn: '9780141439518',
        average_rating: 4.3,
        number_of_pages: 432,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2022-09-01',
        date_read: '2022-10-01',
        my_review: 'Witty romance with sharp social commentary.'
      },
      {
        book_id: 'demo-26',
        title: 'The Book Thief',
        author: 'Markus Zusak',
        isbn: '9780375842207',
        average_rating: 4.4,
        number_of_pages: 552,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2022-08-15',
        date_read: '2022-09-15',
        my_review: 'Beautiful and heartbreaking WWII story.'
      },
      {
        book_id: 'demo-27',
        title: 'The Fault in Our Stars',
        author: 'John Green',
        isbn: '9780525478812',
        average_rating: 4.2,
        number_of_pages: 313,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2022-07-01',
        date_read: '2022-08-01',
        my_review: 'Emotional young adult romance about life and death.'
      },
      {
        book_id: 'demo-28',
        title: 'The Hunger Games',
        author: 'Suzanne Collins',
        isbn: '9780439023528',
        average_rating: 4.3,
        number_of_pages: 374,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2022-06-15',
        date_read: '2022-07-15',
        my_review: 'Gripping dystopian thriller with strong protagonist.'
      },
      {
        book_id: 'demo-29',
        title: 'Gone Girl',
        author: 'Gillian Flynn',
        isbn: '9780307588364',
        average_rating: 4.0,
        number_of_pages: 419,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2022-05-01',
        date_read: '2022-06-01',
        my_review: 'Dark psychological thriller with unreliable narrators.'
      },
      {
        book_id: 'demo-30',
        title: 'The Girl with the Dragon Tattoo',
        author: 'Stieg Larsson',
        isbn: '9780307454546',
        average_rating: 4.1,
        number_of_pages: 590,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2022-04-15',
        date_read: '2022-05-20',
        my_review: 'Complex Swedish crime thriller with compelling characters.'
      },
      // To-read books
      {
        book_id: 'demo-31',
        title: 'The Thursday Murder Club',
        author: 'Richard Osman',
        isbn: '9781984880987',
        average_rating: 4.2,
        number_of_pages: 368,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-04-01',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-32',
        title: 'The Invisible Life of Addie LaRue',
        author: 'V.E. Schwab',
        isbn: '9780765387561',
        average_rating: 4.3,
        number_of_pages: 560,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-04-05',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-33',
        title: 'The Priory of the Orange Tree',
        author: 'Samantha Shannon',
        isbn: '9781635570298',
        average_rating: 4.2,
        number_of_pages: 827,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-04-10',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-34',
        title: 'The Ten Thousand Doors of January',
        author: 'Alix E. Harrow',
        isbn: '9780316421997',
        average_rating: 4.1,
        number_of_pages: 380,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-04-15',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-35',
        title: 'The Poppy War',
        author: 'R.F. Kuang',
        isbn: '9780062662569',
        average_rating: 4.2,
        number_of_pages: 544,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-04-20',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-36',
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        isbn: '9780756404079',
        average_rating: 4.5,
        number_of_pages: 662,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-04-25',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-37',
        title: 'The Way of Kings',
        author: 'Brandon Sanderson',
        isbn: '9780765326355',
        average_rating: 4.6,
        number_of_pages: 1007,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-05-01',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-38',
        title: 'The Fifth Season',
        author: 'N.K. Jemisin',
        isbn: '9780316229296',
        average_rating: 4.3,
        number_of_pages: 512,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-05-05',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-39',
        title: 'The Bear and the Nightingale',
        author: 'Katherine Arden',
        isbn: '9781101885932',
        average_rating: 4.1,
        number_of_pages: 323,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-05-10',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-40',
        title: 'The City & The City',
        author: 'China Miéville',
        isbn: '9780345497512',
        average_rating: 3.9,
        number_of_pages: 370,
        exclusive_shelf: 'to-read',
        my_rating: null,
        date_added: '2024-05-15',
        date_read: null,
        my_review: null
      },
      // Currently reading books
      {
        book_id: 'demo-41',
        title: 'The Stormlight Archive: Words of Radiance',
        author: 'Brandon Sanderson',
        isbn: '9780765326362',
        average_rating: 4.7,
        number_of_pages: 1087,
        exclusive_shelf: 'currently-reading',
        my_rating: null,
        date_added: '2024-05-20',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-42',
        title: 'The Lies of Locke Lamora',
        author: 'Scott Lynch',
        isbn: '9780553588941',
        average_rating: 4.3,
        number_of_pages: 499,
        exclusive_shelf: 'currently-reading',
        my_rating: null,
        date_added: '2024-05-18',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-43',
        title: 'The Blade Itself',
        author: 'Joe Abercrombie',
        isbn: '9780575077423',
        average_rating: 4.2,
        number_of_pages: 515,
        exclusive_shelf: 'currently-reading',
        my_rating: null,
        date_added: '2024-05-16',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-44',
        title: 'The Broken Earth Trilogy: The Obelisk Gate',
        author: 'N.K. Jemisin',
        isbn: '9780316229265',
        average_rating: 4.4,
        number_of_pages: 410,
        exclusive_shelf: 'currently-reading',
        my_rating: null,
        date_added: '2024-05-14',
        date_read: null,
        my_review: null
      },
      {
        book_id: 'demo-45',
        title: 'The Goblin Emperor',
        author: 'Katherine Addison',
        isbn: '9780765326997',
        average_rating: 4.2,
        number_of_pages: 448,
        exclusive_shelf: 'currently-reading',
        my_rating: null,
        date_added: '2024-05-12',
        date_read: null,
        my_review: null
      },
      // More read books to balance the collection
      {
        book_id: 'demo-46',
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '9780374533557',
        average_rating: 4.1,
        number_of_pages: 499,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2022-03-01',
        date_read: '2022-04-10',
        my_review: 'Fascinating insights into human decision-making.'
      },
      {
        book_id: 'demo-47',
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        isbn: '9780812981605',
        average_rating: 4.1,
        number_of_pages: 371,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2022-02-15',
        date_read: '2022-03-20',
        my_review: 'Great companion to Atomic Habits with scientific backing.'
      },
      {
        book_id: 'demo-48',
        title: 'Becoming',
        author: 'Michelle Obama',
        isbn: '9781524763138',
        average_rating: 4.5,
        number_of_pages: 448,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2022-01-01',
        date_read: '2022-02-01',
        my_review: 'Inspiring memoir from a remarkable woman.'
      },
      {
        book_id: 'demo-49',
        title: 'The Subtle Art of Not Giving a F*ck',
        author: 'Mark Manson',
        isbn: '9780062457714',
        average_rating: 3.9,
        number_of_pages: 224,
        exclusive_shelf: 'read',
        my_rating: 3,
        date_added: '2021-12-15',
        date_read: '2022-01-05',
        my_review: 'Unconventional self-help with some good points.'
      },
      {
        book_id: 'demo-50',
        title: 'Born a Crime',
        author: 'Trevor Noah',
        isbn: '9780399588174',
        average_rating: 4.4,
        number_of_pages: 304,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2021-11-01',
        date_read: '2021-12-01',
        my_review: 'Powerful memoir with humor and heart.'
      },
      {
        book_id: 'demo-51',
        title: 'The Immortal Life of Henrietta Lacks',
        author: 'Rebecca Skloot',
        isbn: '9781400052189',
        average_rating: 4.1,
        number_of_pages: 381,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-10-15',
        date_read: '2021-11-15',
        my_review: 'Fascinating blend of science, ethics, and human story.'
      },
      {
        book_id: 'demo-52',
        title: 'The Lean Startup',
        author: 'Eric Ries',
        isbn: '9780307887894',
        average_rating: 4.1,
        number_of_pages: 336,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-09-01',
        date_read: '2021-10-01',
        my_review: 'Essential reading for entrepreneurs and innovators.'
      },
      {
        book_id: 'demo-53',
        title: 'Bad Blood',
        author: 'John Carreyrou',
        isbn: '9781524731656',
        average_rating: 4.4,
        number_of_pages: 339,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2021-08-15',
        date_read: '2021-09-10',
        my_review: 'Gripping true story of corporate fraud and deception.'
      },
      {
        book_id: 'demo-54',
        title: 'The Righteous Mind',
        author: 'Jonathan Haidt',
        isbn: '9780307455772',
        average_rating: 4.2,
        number_of_pages: 419,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-07-01',
        date_read: '2021-08-05',
        my_review: 'Insightful exploration of moral psychology.'
      },
      {
        book_id: 'demo-55',
        title: 'Guns, Germs, and Steel',
        author: 'Jared Diamond',
        isbn: '9780393317558',
        average_rating: 4.0,
        number_of_pages: 528,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-06-15',
        date_read: '2021-07-20',
        my_review: 'Ambitious look at the factors that shaped human civilization.'
      },
      {
        book_id: 'demo-56',
        title: 'The Code Breaker',
        author: 'Walter Isaacson',
        isbn: '9781982115852',
        average_rating: 4.2,
        number_of_pages: 560,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-05-01',
        date_read: '2021-06-10',
        my_review: 'Fascinating biography of Jennifer Doudna and CRISPR.'
      },
      {
        book_id: 'demo-57',
        title: 'The Innovator\'s Dilemma',
        author: 'Clayton M. Christensen',
        isbn: '9780062060242',
        average_rating: 4.1,
        number_of_pages: 286,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-04-15',
        date_read: '2021-05-15',
        my_review: 'Classic business book on disruptive innovation.'
      },
      {
        book_id: 'demo-58',
        title: 'Zero to One',
        author: 'Peter Thiel',
        isbn: '9780804139298',
        average_rating: 4.2,
        number_of_pages: 210,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-03-01',
        date_read: '2021-04-01',
        my_review: 'Contrarian thinking about startups and monopolies.'
      },
      {
        book_id: 'demo-59',
        title: 'The Hard Thing About Hard Things',
        author: 'Ben Horowitz',
        isbn: '9780062273208',
        average_rating: 4.2,
        number_of_pages: 304,
        exclusive_shelf: 'read',
        my_rating: 4,
        date_added: '2021-02-15',
        date_read: '2021-03-15',
        my_review: 'Honest advice about the challenges of building a business.'
      },
      {
        book_id: 'demo-60',
        title: 'Shoe Dog',
        author: 'Phil Knight',
        isbn: '9781501135910',
        average_rating: 4.4,
        number_of_pages: 400,
        exclusive_shelf: 'read',
        my_rating: 5,
        date_added: '2021-01-01',
        date_read: '2021-02-01',
        my_review: 'Incredible memoir of Nike\'s founding and growth.'
      }
    ];
    
    let insertedCount = 0;
    
    for (const book of demoBooks) {
      try {
        const result = await pool.query(`
          INSERT INTO books (book_id, user_id, title, author, isbn, average_rating, number_of_pages, exclusive_shelf, my_rating, date_added, date_read, my_review)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (user_id, book_id) DO UPDATE SET
          title = EXCLUDED.title,
          author = EXCLUDED.author,
          isbn = EXCLUDED.isbn,
          average_rating = EXCLUDED.average_rating,
          number_of_pages = EXCLUDED.number_of_pages,
          exclusive_shelf = EXCLUDED.exclusive_shelf,
          my_rating = EXCLUDED.my_rating,
          date_added = EXCLUDED.date_added,
          date_read = EXCLUDED.date_read,
          my_review = EXCLUDED.my_review
        `, [
          book.book_id,
          1, // Demo user ID
          book.title,
          book.author,
          book.isbn,
          book.average_rating,
          book.number_of_pages,
          book.exclusive_shelf,
          book.my_rating,
          book.date_added,
          book.date_read,
          book.my_review
        ]);
        
        insertedCount++;
        console.log(`✅ Added: "${book.title}" by ${book.author}`);
        
      } catch (error) {
        console.error(`❌ Failed to add "${book.title}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Demo data setup complete!`);
    console.log(`📚 Added ${insertedCount} books for demo user`);
    
    // Verify the data
    console.log('\n📊 Verifying demo data...');
    const shelfCounts = await pool.query(`
      SELECT exclusive_shelf, COUNT(*) 
      FROM books 
      WHERE user_id = 1 
      GROUP BY exclusive_shelf
    `);
    
    console.log('Shelf distribution:');
    shelfCounts.rows.forEach(row => {
      console.log(`  - ${row.exclusive_shelf}: ${row.count} books`);
    });
    
    console.log('\n✅ Demo mode is now ready to use!');
    console.log('🎮 Go to your app and click "Try Demo Mode"');
    
  } catch (error) {
    console.error('❌ Error setting up demo data:', error);
  }
}

setupDemoData(); 