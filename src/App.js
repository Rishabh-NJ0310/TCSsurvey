import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import NewApplication from './components/NewApplication';
import ViewApplication from './components/ViewApplication';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewApplication />} />
            <Route path="/application/:id" element={<ViewApplication />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;