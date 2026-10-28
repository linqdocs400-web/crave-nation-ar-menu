import { useCallback, useState } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { ArScreen } from './screens/ArScreen';
import { DemoModeView } from './screens/DemoModeView';

export type FlowScreen = 'welcome' | 'ar' | 'demo';

export function App() {
  const [screen, setScreen] = useState<FlowScreen>('welcome');

  const openAr = useCallback(() => setScreen('ar'), []);
  const openDemo = useCallback(() => setScreen('demo'), []);
  const backToWelcome = useCallback(() => setScreen('welcome'), []);

  if (screen === 'ar') {
    return <ArScreen onExit={backToWelcome} onFallback={openDemo} />;
  }
  if (screen === 'demo') {
    return <DemoModeView onExit={backToWelcome} />;
  }
  return <WelcomeScreen onExplore={openAr} />;
}
