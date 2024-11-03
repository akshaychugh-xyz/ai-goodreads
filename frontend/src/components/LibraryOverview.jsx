import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { api } from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const LibraryOverview = ({ isDemoMode }) => {
  console.log('LibraryOverview - isDemoMode:', isDemoMode);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalBooks = stats?.shelfDistribution?.reduce((sum, shelf) => 
    sum + parseInt(shelf.count), 0) || 0;
  const booksRead = stats?.shelfDistribution?.find(
    shelf => shelf.exclusive_shelf === 'read'
  )?.count || 0;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching library stats with demo mode:', isDemoMode);
        const data = await api.getLibraryStats(isDemoMode);
        console.log('Fetched library stats:', data);
        setStats({
          shelfDistribution: data.shelfDistribution || [],
          topRatedBooks: data.topRatedBooks || [],
          personalityTags: data.personalityTags || [],
          topAuthor: data.topAuthor || null,
          readingStats: data.readingStats || {
            avg_length: 0,
            longest_book: 0,
            books_read: 0
          }
        });
      } catch (error) {
        console.error('Error fetching library stats:', error);
        setError('Failed to load library stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isDemoMode]);

  if (loading) {
    return <div className="text-wood">Loading your library stats...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Prepare pie chart data with null checks
  const pieData = {
    labels: stats?.shelfDistribution?.map(shelf => shelf.exclusive_shelf) || [],
    datasets: [{
      data: stats?.shelfDistribution?.map(shelf => shelf.count) || [],
      backgroundColor: ['#8B7355', '#A87D5F', '#8E354A'],
      borderColor: '#FFF8E7',
      borderWidth: 2,
    }]
  };

  return (
    <Card className="bg-cream/30 p-6">
      <CardHeader>
        <CardTitle className="font-display text-2xl text-ink">Your Reading Journey</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Top Stats */}
        <div className="flex justify-between items-center mb-8 border-b border-wood/10 pb-6">
          <div className="text-center">
            <div className="text-4xl font-serif text-wood">{totalBooks}</div>
            <div className="text-sm uppercase tracking-wide text-wood/60">TOTAL BOOKS</div>
          </div>
          <div className="w-px h-16 bg-wood/10"></div>
          <div className="text-center">
            <div className="text-4xl font-serif text-wood">{booksRead}</div>
            <div className="text-sm uppercase tracking-wide text-wood/60">BOOKS READ</div>
          </div>
        </div>

        {/* Middle Section - Chart and Top 3 Tags */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-b border-wood/10 pb-6">
          {/* Pie Chart */}
          <div className="h-64">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>

          {/* Top 3 Personality Tags */}
          <div className="space-y-3">
            <h3 className="font-display text-lg text-ink mb-4">Top Reader Traits</h3>
            {stats?.personalityTags && stats.personalityTags.length > 0 ? (
              stats.personalityTags.slice(0, 3).map((tag, i) => (
                <div key={i} className="bg-cream/50 p-3 rounded-lg">
                  <div className="font-serif text-lg text-wood">{tag.label}</div>
                  <div className="text-sm text-wood/70">{tag.description}</div>
                </div>
              ))
            ) : (
              <div className="bg-cream/50 p-3 rounded-lg">
                <div className="font-serif text-lg text-wood">Still Analyzing...</div>
                <div className="text-sm text-wood/70">Import more books to reveal your reading traits!</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Reading Insights */}
        <div className="grid grid-cols-3 gap-6">
          {/* Most Read Author */}
          <div>
            <h3 className="text-sm text-wood/60 uppercase mb-2">Most Read Author</h3>
            <div className="font-serif text-xl text-wood">
              {stats?.topAuthor?.author || 'No data'}
              <div className="text-sm text-wood/70">{stats?.topAuthor?.book_count || 0} books read</div>
            </div>
          </div>

          {/* Top Rated Books */}
          <div>
            <h3 className="text-sm text-wood/60 uppercase mb-2">Your Highest Rated</h3>
            <div className="space-y-2">
              {(stats?.topRatedBooks || []).map((book, i) => (
                <div key={i}>
                  <div className="font-serif text-wood">{book.title}</div>
                  <div className="text-sm text-wood/70">{book.author} • {book.my_rating}★</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reading Stats */}
          <div>
            <h3 className="text-sm text-wood/60 uppercase mb-2">Reading Stats</h3>
            <div className="space-y-2 font-serif text-wood">
              <div>📏 Average book: {stats?.readingStats?.avg_length || 0} pages</div>
              <div>📚 Longest read: {stats?.readingStats?.longest_book || 0} pages</div>
              <div>🏃‍♂️ Most productive: {stats?.readingStats?.books_read || 0} books/month</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LibraryOverview;