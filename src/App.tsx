import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { Landing } from './pages/Landing';
import { HowItWorks } from './pages/HowItWorks';
import { Features } from './pages/Features';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';
import { Overview } from './pages/Overview';
import { Journey } from './pages/Journey';
import { Records } from './pages/Records';
import { Signals } from './pages/Signals';
import { ChatBot } from './pages/ChatBot';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="features" element={<Features />} />
          <Route path="about" element={<About />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>

        {/* Workspace routes */}
        <Route path="/workspace" element={<WorkspaceLayout />}>
          <Route index element={<Overview />} />
          <Route path="overview" element={<Overview />} />
          <Route path="journey" element={<Journey />} />
          <Route path="records" element={<Records />} />
          <Route path="signals" element={<Signals />} />
          <Route path="chatbot" element={<ChatBot />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
