import React, { useState, useEffect } from 'react';
import { getUpdates } from '../data/repositories/updateRepository';
import { UpdateLog } from '../types';
import Card from '../components/ui/Card';

export default function Updates() {
  const [updates, setUpdates] = useState<UpdateLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getUpdates();
        
        // Reverse array to display the latest updates first (JSON bottom-to-top)
        const reversed = [...data].reverse();
        setUpdates(reversed);
      } catch (err) {
        console.error('Failed to load updates', err);
        setError('Failed to load system updates. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  return (
    <div className="py-8 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-text-primary via-accent-cyan to-accent-teal bg-clip-text text-transparent uppercase">
          System Updates
        </h1>
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
          Log of changes, feature releases, and bug fixes for GachaMe.
        </p>
      </div>

      {/* States: Loading, Error, Empty, Data */}
      {isLoading ? (
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="w-full h-32 bg-bg-secondary/25 border border-border-color rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-error/10 border border-error/30 text-error text-center text-sm font-semibold">
          {error}
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center p-12 border border-border-color rounded-xl bg-bg-secondary/20 text-text-secondary text-sm">
          No system updates found.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {updates.map((log, index) => (
            <Card
              key={log.version}
              hoverable
              glow={index === 0} // Highlight latest version card with a subtle glow
              className={`relative border transition-all duration-300 ${
                index === 0 
                  ? 'border-accent-cyan/40 bg-bg-secondary/45 shadow-md shadow-accent-cyan/5' 
                  : 'border-border-color bg-bg-secondary/25'
              }`}
            >
              {/* Highlight badge for the latest release */}
              {index === 0 && (
                <span className="absolute top-4 right-4 px-2 py-0.5 border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan text-[9px] font-extrabold rounded uppercase tracking-wider animate-pulse">
                  Latest Version
                </span>
              )}

              {/* Version & Date */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xl font-black text-text-primary tracking-tight font-mono">
                  v{log.version}
                </span>
                <span className="text-xs text-text-secondary/50 font-semibold font-mono">
                  {log.date}
                </span>
              </div>

              {/* Bullet list of changes */}
              <ul className="list-none pl-0 flex flex-col gap-2.5">
                {log.changes.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2.5 text-text-secondary text-sm leading-relaxed">
                    <span className={`text-[10px] mt-1.5 ${index === 0 ? 'text-accent-cyan' : 'text-text-secondary/60'}`}>
                      ✦
                    </span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
