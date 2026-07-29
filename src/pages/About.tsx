import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ImageContainer from '../components/ui/ImageContainer';

export default function About() {
  const profileData = {
    avatarUrl: 'https://github.com/ArnutDev.png',
    name: 'Arnut Dev',
    description: 'Creator & Developer of GachaMe, a premium browser-based LINE Rangers Gacha simulator designed to provide clean statistical analysis and a premium user experience.',
    email: 'arnut.dev@example.com',
    googleFormUrl: 'https://forms.gle/example-google-form',
  };

  return (
    <div className="py-12 px-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <Card className="w-full relative flex flex-col items-center text-center p-8 rounded-2xl border border-accent-cyan/35 bg-bg-secondary/40 backdrop-blur-md shadow-xl shadow-accent-cyan/5 overflow-hidden animate-scaleIn">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-radial-gradient from-accent-cyan/5 to-transparent pointer-events-none rounded-2xl blur-xl" />

        {/* Profile Avatar */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-accent-cyan shadow-lg shadow-accent-cyan/20 mb-6 relative group">
          <ImageContainer
            src={profileData.avatarUrl}
            alt={profileData.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Name */}
        <h2 className="text-2xl font-black text-text-primary tracking-tight font-sans mb-2">
          {profileData.name}
        </h2>

        {/* Developer Badge */}
        <span className="px-3 py-1 mb-6 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs font-black rounded-full uppercase tracking-wider">
          Developer
        </span>

        {/* Description */}
        <p className="text-text-secondary text-sm sm:text-base max-w-md leading-relaxed mb-6">
          {profileData.description}
        </p>

        {/* Contact Info */}
        <div className="flex flex-col gap-2 items-center mb-8 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="text-lg">📧</span>
            <a href={`mailto:${profileData.email}`} className="text-accent-cyan hover:underline font-medium">
              {profileData.email}
            </a>
          </div>
        </div>

        {/* Google Form Link Button */}
        <Button
          variant="secondary"
          onClick={() => window.open(profileData.googleFormUrl, '_blank', 'noopener,noreferrer')}
          className="px-8 py-3 text-sm font-extrabold tracking-wider uppercase flex items-center gap-2 transition-all"
        >
          <span>📝</span> Send Feedback / Contact Form
        </Button>
      </Card>
    </div>
  );
}
