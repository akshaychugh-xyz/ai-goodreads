import React from 'react';
import Header from '../components/Header';
import ValueProposition from '../components/ValueProposition';
import ImportBooks from '../components/ImportBooks';

const HomePage = () => {
  const handleImportComplete = () => {
    // Handle import completion, e.g., show a success message or refresh data
    console.log('Import completed successfully');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <ImportBooks onImportComplete={handleImportComplete} />
      <ValueProposition />
    </div>
  );
};

export default HomePage;