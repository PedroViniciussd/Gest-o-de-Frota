'use client';

import { useEffect, useState } from 'react';

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <button onClick={install} className="btn-secondary w-full" disabled={!promptEvent}>
      {promptEvent ? 'Instalar app' : 'Instalação indisponível neste navegador'}
    </button>
  );
}
