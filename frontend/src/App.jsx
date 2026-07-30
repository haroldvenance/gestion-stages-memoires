import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <AuthProvider>
       


		<Routes>
		  <Route path="/" element={<Home />} />
		  <Route path="/login" element={<Login />} />
		  <Route path="/dashboard/etudiant" element={<DashboardEtudiant />} />
		  
		</Routes>
      </AuthProvider>
    </Router>
  );
}
export default App;