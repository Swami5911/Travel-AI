

# Travel.AI: Your Intelligent Travel Companion

Travel.AI is an AI-powered travel planning and exploration web application. It helps users generate personalized itineraries, discover top tourist spots, get real-time weather and air quality information, and interact with a voice-enabled AI travel assistant.

## ✨ Core Features
- **Multi-Model AI Selector**: Dynamically select which LLM provider to use (Google Gemini, OpenAI GPT-4o, Groq, Grok, OpenRouter) to generate travel plans.
- **Smart Itinerary Generation**: Generate multi-day travel plans incorporating user-selected spots, logically timed schedules, and local events.
- **City & Destination Discovery**: Explore cities, view famous tourist spots, and see AI-generated descriptions and images.
- **RideBy Route Planner**: Plan detailed road trips (car/bike) with AI, generating waypoints, sequence of stops, distance, safe driving tips, and fetching real-time Air Quality (AQI) along the route.
- **Voice Assistant**: A conversational AI specifically tuned to be a "Travel Buddy," capable of chatting, answering location-specific queries, and parsing music playback intents (e.g., play/pause).
- **Role-based Dashboards**: Dedicated UI and features for `admin`, `guide`, and regular `visitors`.
- **Itinerary Sharing**: Encodes generated itineraries into the URL (Base64 + URI encoded) so they can be easily shared with others.

## 🛠️ Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: `lucide-react`
- **AI Integrations**: Google GenAI SDK (`@google/genai`), OpenAI SDK (`openai`) for broad provider support.

## 🚀 How to Run Locally

### Prerequisites
- Node.js installed on your machine.
- API Keys for the AI service(s) you wish to use (e.g., Gemini API Key).

### Setup Instructions

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/Swami5911/Travel-AI.git
   cd Travel-AI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your API keys. At a minimum, provide a Gemini key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional configurations for other models:
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_GROQ_API_KEY=your_groq_api_key_here
   VITE_GROK_API_KEY=your_grok_api_key_here
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to the URL provided by Vite (usually `http://localhost:5173/`) to explore Travel.AI!
