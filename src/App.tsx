import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, User, ChevronDown, Activity } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Services from './pages/Services';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Chatbot from './legacy/Chatbot';
import AudioTherapy from './pages/AudioTherapy';
import MoodAssessmentPage from './pages/MoodAssessmentPage';
import DoctorConsultation from './pages/DoctorConsultation';
import ChatWithPulse from './features/chat/ChatWithPulse';
import LaughingTherapy from './pages/LaughingTherapy';
import ReadingTherapy from './pages/ReadingTherapy';
import PhysicalTherapy from './pages/PhysicalTherapy';
import CreateTask from './pages/CreateTask';
import Recommendations from './pages/Recommendations';
import CreateRecommendation from './pages/CreateRecommendation';
import CreateEvent from './pages/CreateEvent';
import Notifications from './components/Notifications';
import ProfilePage from './pages/ProfilePage';
import Diary from './pages/Diary';
import AgeVerificationModal from './components/AgeVerificationModal';
import DisclaimerFooter from './components/DisclaimerFooter';
import CommunityGuidelines from './pages/CommunityGuidelines';

// TODO: Consider moving these routes to a separate config file
// FIXME: Need to implement proper error boundaries for route components

function AppContent() {
  // TODO: Consider using a reducer for complex state management
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Check age verification on mount
  useEffect(() => {
    const isVerified = localStorage.getItem('age_verified');
    if (!isVerified) {
      setShowAgeVerification(true);
    }
  }, []);

  const handleAgeVerification = (isVerified: boolean) => {
    if (isVerified) {
      setShowAgeVerification(false);
    } else {
      // Redirect to a safe page if user is under 18
      window.location.href = 'https://www.commonsensemedia.org/';
    }
  };

  // Show loading spinner while authentication is being initialized
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // FIXME: This should be memoized if performance becomes an issue
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-black/90 backdrop-blur-sm fixed w-full z-50 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img 
                src="/PulseMindlogo.png" 
                alt="PulseMind Logo" 
                className="h-7 w-auto"
              />
              <span className="text-xl font-bold">
                <span className="text-white">Pulse</span>
                <span className="text-stress-yellow">Mind</span>
              </span>
            </Link>
            
            {/* Center Navigation Links */}
            <div className="flex items-center space-x-4">
            {/* Services Dropdown */}
            <div className="relative" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}>
              <Link to="/services" className="flex items-center space-x-1 text-yellow-500 hover:text-yellow-400 transition-colors text-sm font-medium">
                <span>Services</span>
                <ChevronDown className="w-4 h-4" />
              </Link>
              <div className={`absolute top-full left-0 mt-2 w-48 bg-black border border-yellow-500/20 rounded-lg shadow-lg transition-all duration-200 z-50 ${isServicesOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="py-2">
                  <Link to="/services/audio" className="block px-4 py-2 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors text-sm">Audio Therapy</Link>
                  <Link to="/services/physical" className="block px-4 py-2 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors text-sm">Physical Therapy</Link>
                  <Link to="/services/laughing" className="block px-4 py-2 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors text-sm">Laughing Therapy</Link>
                  <Link to="/services/reading" className="block px-4 py-2 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors text-sm">Reading Therapy</Link>
                  <Link to="/doctor-consultation" className="block px-4 py-2 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors text-sm">Doctor Consultation</Link>
                </div>
              </div>
            </div>

            {/* Sentiscope Link */}
            <Link 
              to="/mood-assessment"
              className="flex items-center space-x-1 text-yellow-500 hover:text-yellow-400 transition-colors text-sm font-medium"
            >
              <Activity className="w-4 h-4" />
              <span>Sentiscope</span>
            </Link>

            {/* Community Link */}
            <Link 
              to="/recommendations"
              className="text-yellow-500 hover:text-yellow-400 transition-colors text-sm font-medium"
            >
              Community
            </Link>

            {/* Diary Link - Only show when logged in */}
            {user && (
              <Link 
                to="/diary"
                className="text-yellow-500 hover:text-yellow-400 transition-colors text-sm font-medium"
              >
                📔 Diary
              </Link>
            )}

            {/* Chatbot Button */}
            <Link
              to="/chat-with-pulse"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black transition-all font-semibold text-sm"
              aria-label="Chat with us"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </Link>
            </div>
            
            {/* Right - Auth Section */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {user ? (
                <>
                  <Notifications />
                  <Link 
                    to="/profile"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400 transition-all text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>{user.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-yellow-500 text-black px-3 py-1.5 rounded-full hover:bg-yellow-400 transition-all font-semibold text-sm"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-yellow-500 hover:text-yellow-400 transition-colors text-sm font-medium">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-yellow-500 text-black px-4 py-1.5 rounded-full hover:bg-yellow-400 transition-all font-semibold text-sm">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/audio" element={<AudioTherapy />} />
          <Route path="/services/physical" element={<PhysicalTherapy />} />
          <Route path="/services/laughing" element={<LaughingTherapy />} />
          <Route path="/services/reading" element={<ReadingTherapy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/chat-with-pulse" element={<ChatWithPulse />} />
          <Route path="/doctor-consultation" element={<DoctorConsultation />} />  
          <Route path="/mood-assessment" element={<MoodAssessmentPage />} />
          <Route path="/create-task" element={<CreateTask />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/create-recommendation" element={<CreateRecommendation />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
        </Routes>
      </div>

      {/* Disclaimer Footer */}
      <DisclaimerFooter />

      {/* Chatbot Component */}
      {showChat && <Chatbot showChat={showChat} setShowChat={setShowChat} />}

      {/* Age Verification Modal */}
      {showAgeVerification && <AgeVerificationModal onVerify={handleAgeVerification} />}
    </div>
  );
}

// Wrapper component to provide auth context
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
