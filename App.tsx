
import React, { useState, useEffect } from 'react';
import { Page, User, City, TouristSpot, Itinerary } from './types';
import { getCityInfo, AIProvider } from './services/aiService'; // Updated import
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import DestinationPage from './components/DestinationPage';
import SpotsPage from './components/SpotsPage';
import PlanPage from './components/PlanPage';
import TrackerPage from './components/TrackerPage';
import { BookGuidePage } from './components/BookGuidePage';
import RideByPage from './components/RideByPage'; // Added import for RideByPage
import { db } from './services/dbService';
import AdminDashboard from './components/AdminDashboard';
import GuideDashboard from './components/GuideDashboard';
import Toast from './components/Toast';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Compass, Map as MapIcon, Bike } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedSpots, setSelectedSpots] = useState<TouristSpot[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isFetchingCity, setIsFetchingCity] = useState(false);
  const [initialCityName, setInitialCityName] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini');
  

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planData = urlParams.get('plan');

    if (planData) {
      try {
        // Unicode-safe base64 decoding
        const decodedJson = decodeURIComponent(
            atob(decodeURIComponent(planData))
                .split('')
                .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
                .join('')
        );
        const sharedItinerary: Itinerary = JSON.parse(decodedJson);
        setItinerary(sharedItinerary);
        setCurrentPage(Page.SHARED_PLAN);
      } catch (e) {
        console.error("Failed to parse shared plan data:", e);
        setCurrentPage(Page.LOGIN);
      }
    }
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage(Page.DESTINATION);
  };

  const handleSelectCity = async (cityData: { name: string; country: string }) => {
    // Clear previous session data when a NEW city is explicitly selected
    setItinerary(null);
    setSelectedSpots([]);
    
    setIsFetchingCity(true);
    setInitialCityName(cityData.name);
    setCurrentPage(Page.SPOTS);
    // Pass selectedProvider explicitly
    const detailedCityInfo = await getCityInfo(cityData.name, selectedProvider);
    
    if (detailedCityInfo) {
      setSelectedCity(detailedCityInfo);
    } else {
      setSelectedCity(null);
    }
    setIsFetchingCity(false);
  };

  const handleSelectSpots = (spots: TouristSpot[]) => {
    setSelectedSpots(spots);
    setCurrentPage(Page.PLAN);
  };

  const handlePlanGenerated = async (generatedItinerary: Itinerary) => {
    setItinerary(generatedItinerary);
    // setIsGeneratingPlan(false); // Removed as state doesn't exist here, managed inside PlanPage? No, PlanPage manages its own loading.
    
    // Save to History if User is Visitor
    if (user && user.role === 'visitor') {
        const updatedUser = await db.addItineraryToHistory(user.id, generatedItinerary);
        if (updatedUser) {
            setUser({ ...updatedUser }); // Force state update by creating a new object reference
        }
    }
  };
  
  const handleNavigateToTracker = () => {
    setCurrentPage(Page.TRACKER);
  };
  
  const handleNavigateToBookGuide = () => {
    setCurrentPage(Page.BOOK_GUIDE);
  };

  const handleNavigateToRideBy = () => {
    setCurrentPage(Page.RIDE_BY);
  };

  const handleBack = () => {
    if (currentPage === Page.SPOTS) {
        setSelectedCity(null);
        setInitialCityName("");
        setSelectedSpots([]);
    }
    if (currentPage === Page.PLAN) {
        setSelectedSpots([]);
        setItinerary(null);
    }

    if (currentPage === Page.BOOK_GUIDE) setCurrentPage(Page.PLAN);
    else if (currentPage === Page.TRACKER) setCurrentPage(Page.PLAN);
    else if (currentPage === Page.RIDE_BY) setCurrentPage(Page.DESTINATION); // Added back navigation for RideBy
    else if (currentPage === Page.PLAN) setCurrentPage(Page.SPOTS);
    else if (currentPage === Page.SPOTS) setCurrentPage(Page.DESTINATION);
    else if (currentPage === Page.DESTINATION) setCurrentPage(Page.LOGIN);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.LOGIN:
        return <LoginPage onLogin={handleLogin} />;
      case Page.DESTINATION:
        // Role Guard
        if (user && user.role === 'admin') return <AdminDashboard user={user as any} onLogout={() => { setUser(null); setCurrentPage(Page.LOGIN); }} />;
        if (user && user.role === 'guide') return <GuideDashboard user={user as any} onLogout={() => { setUser(null); setCurrentPage(Page.LOGIN); }} />;
        
        return <DestinationPage 
            onSelectCity={handleSelectCity} 
            provider={selectedProvider} 
            previousPlan={itinerary} 
            onResumePlan={() => setCurrentPage(Page.PLAN)}
            // Ensure we are passing the full history array
            history={user && user.role === 'visitor' ? (user as any).history || [] : []}
            onLoadHistory={(oldItinerary) => {
                setItinerary(oldItinerary);
                setCurrentPage(Page.PLAN);
                // Also need to set the city details for context if possible, but minimal reset is fine for now
                if (!selectedCity) {
                     // Try to mock a base city object from the itinerary title if not present
                     setSelectedCity({
                        name: oldItinerary.tripTitle.replace("Your Awesome Trip to ", "").replace('Trip to ', ''),
                        country: '',
                        description: 'Loaded from History',
                        image: '',
                        spots: []
                     });
                }
            }}
        />;
      case Page.SPOTS:
        return <SpotsPage city={selectedCity} onBack={handleBack} onContinue={handleSelectSpots} />;
      case Page.PLAN:
        if (!selectedCity) {
            return <DestinationPage onSelectCity={handleSelectCity} provider={selectedProvider} />;
        }
        return <PlanPage city={selectedCity} selectedSpots={selectedSpots} onPlanGenerated={handlePlanGenerated} itinerary={itinerary} onNavigateToTracker={handleNavigateToTracker} onNavigateToBookGuide={handleNavigateToBookGuide} isSharedView={false} provider={selectedProvider} />;
      case Page.TRACKER:
        return <TrackerPage />;
      case Page.BOOK_GUIDE:
        if (!selectedCity) return <DestinationPage onSelectCity={handleSelectCity} provider={selectedProvider} />;
        return <BookGuidePage city={selectedCity} showToast={showToast} provider={selectedProvider} />;
      case Page.RIDE_BY: // Added case for RideByPage
        return <RideByPage provider={selectedProvider} />;
      case Page.SHARED_PLAN:
        if (!itinerary) return <LoginPage onLogin={handleLogin} />;
        
        const mockCity: City = {
            name: itinerary.tripTitle.replace("Your Awesome Trip to ", "").replace("Trip to ",""),
            country: '',
            image: '',
            description: 'Shared Trip Plan',
            spots: [],
        };
        
        return <PlanPage 
            city={mockCity} 
            selectedSpots={[]}
            itinerary={itinerary}
            onPlanGenerated={() => {}}
            onNavigateToTracker={() => {}}
            onNavigateToBookGuide={() => {}}
            isSharedView={true}
            provider={selectedProvider}
        />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <HelmetProvider>
      <div className="min-h-screen text-slate-100 font-inter pb-24 relative overflow-hidden">
        <Helmet>
          <title>AI Travel Planner</title>
          <meta name="description" content="Plan your dream trip with AI. Personalized itineraries, local guides, and more." />
        </Helmet>

         {/* Background Orbs (CSS Animation) */}
        <div className="fixed top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-float -z-10"></div>
        <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-float -z-10" style={{ animationDelay: '2s' }}></div>

        {/* Model Selector UI - Hidden as requested */}
        {currentPage !== Page.LOGIN && currentPage !== Page.SHARED_PLAN && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/40 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-2xl">
                <button 
                    onClick={() => setSelectedProvider('gemini')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${selectedProvider === 'gemini' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    Gemini
                </button>
                <button 
                    onClick={() => setSelectedProvider('openai')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${selectedProvider === 'openai' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    GPT-4o
                </button>
                <button 
                    onClick={() => setSelectedProvider('grok')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${selectedProvider === 'grok' ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    Grok
                </button>
                <button 
                    onClick={() => setSelectedProvider('qwen')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${selectedProvider === 'qwen' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    Qwen
                </button>
            </div>
        )}

      {/* Navbar */}
      {currentPage !== Page.LOGIN && currentPage !== Page.SHARED_PLAN && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex justify-around items-center shadow-2xl shadow-black/50">
                <button
                    onClick={() => handleNavigate(Page.DESTINATION)}
                    className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentPage === Page.DESTINATION ? 'text-purple-400 bg-white/5 scale-110' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                >
                    <Compass className={`h-6 w-6 ${currentPage === Page.DESTINATION ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Explore</span>
                </button>
                <button
                    onClick={handleNavigateToRideBy}
                    className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentPage === Page.RIDE_BY ? 'text-orange-400 bg-white/5 scale-110' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                >
                    <Bike className={`h-6 w-6 ${currentPage === Page.RIDE_BY ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">RideBy</span>
                </button>
                <button
                    onClick={() => handleNavigate(Page.PLAN)}
                    className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentPage === Page.PLAN ? 'text-blue-400 bg-white/5 scale-110' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                >
                    <MapIcon className={`h-6 w-6 ${currentPage === Page.PLAN ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">My Plan</span>
                </button>
            </div>
        </div>
      )}

        {currentPage !== Page.SHARED_PLAN && <Header user={user} onBack={handleBack} showBackButton={currentPage !== Page.LOGIN} />}
        <main className="p-4 sm:p-6 md:p-8 relative z-10">
          {renderPage()}
        </main>
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </div>
    </HelmetProvider>
  );
};

export default App;