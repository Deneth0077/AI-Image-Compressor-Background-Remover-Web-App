'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/hero/HeroSection';
import { ImageWorkspace } from '@/components/editor/ImageWorkspace';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [removeBgMode, setRemoveBgMode] = useState<boolean>(false);

  const handleSelectTab = (tab: string) => {
    if (tab === 'bg-remover') {
      setRemoveBgMode(true);
    } else {
      setRemoveBgMode(false);
    }
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header onSelectTab={handleSelectTab} />

      <main className="flex-1">
        <HeroSection onUploadClick={() => handleSelectTab('compress')} />

        <div ref={workspaceRef} className="scroll-mt-20">
          <ImageWorkspace initialRemoveBackground={removeBgMode} key={removeBgMode ? 'bg' : 'normal'} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
