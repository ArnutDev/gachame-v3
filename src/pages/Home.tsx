import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ImageContainer from '../components/ui/ImageContainer';

export default function Home() {
  return (
    <div className="py-10 max-w-6xl mx-auto flex flex-col items-center">
      {/* Hero Welcome Header */}
      <div className="text-center mb-12 max-w-3xl px-4 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-text-primary via-accent-cyan to-accent-teal bg-clip-text text-transparent uppercase">
          Welcome to GachaMe
        </h1>
        <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
          A fan-made LINE Rangers gacha simulator where you can pull for both
          Rangers and Gears. Test your luck and enjoy unlimited summons in your
          browser.
        </p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {/* Ranger Gacha Card */}
        <Link to="/ranger-gacha" className="group no-underline block h-full">
          <Card
            hoverable
            glow
            className="flex flex-col h-full border border-accent-cyan/45 bg-bg-secondary/25 group-hover:border-accent-cyan/75 hover:shadow-xl hover:shadow-accent-cyan/10"
          >
            {/* Top Part: Image Banner */}
            <div className="relative rounded-lg overflow-hidden mb-5 border border-border-color/40 group-hover:border-accent-cyan/35 transition-all duration-300">
              <ImageContainer
                src="https://gachame.github.io/images/banner-gacha/rangers-banner.jpg"
                alt="Ranger Gacha Banner"
                aspectRatio="video"
                objectFit="cover"
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-bg-primary/80 backdrop-blur-md border border-accent-cyan/30 text-accent-cyan text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                Rangers
              </div>
            </div>

            {/* Bottom Part: Content */}
            <div className="flex flex-col flex-grow">
              <h2 className="text-3xl font-black text-text-primary mb-2 group-hover:text-accent-cyan transition-colors tracking-tight">
                Gacha Rangers
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-grow">
                Pull 7★ and 8★ Normal and Ultra Rangers.
              </p>

              {/* Action Button Indicator */}
              <div className="mt-auto">
                <Button
                  variant="primary"
                  className="w-full justify-center gap-2 pointer-events-none font-black uppercase tracking-wider text-xs py-3.5 bg-gradient-to-r from-accent-teal to-emerald-400 text-bg-primary border-none shadow-md shadow-accent-teal/15 group-hover:shadow-lg group-hover:shadow-accent-teal/35 group-hover:brightness-110 transition-all duration-300"
                >
                  <span> Click to Gacha</span>
                </Button>
              </div>
            </div>
          </Card>
        </Link>

        {/* Gear Gacha Card */}
        <Link to="/gear-gacha" className="group no-underline block h-full">
          <Card
            hoverable
            glow
            className="flex flex-col h-full border border-accent-cyan/45 bg-bg-secondary/25 group-hover:border-accent-teal/75 hover:shadow-xl hover:shadow-accent-teal/10"
          >
            {/* Top Part: Image Banner */}
            <div className="relative rounded-lg overflow-hidden mb-5 border border-border-color/40 group-hover:border-accent-teal/35 transition-all duration-300">
              <ImageContainer
                src="https://gachame.github.io/images/banner-gacha/gears-banner.jpg"
                alt="Gear Gacha Banner"
                aspectRatio="video"
                objectFit="cover"
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-bg-primary/80 backdrop-blur-md border border-accent-teal/30 text-accent-teal text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                Gears
              </div>
            </div>

            {/* Bottom Part: Content */}
            <div className="flex flex-col flex-grow">
              <h2 className="text-3xl font-black text-text-primary mb-2 group-hover:text-accent-teal transition-colors tracking-tight">
                Gacha Gears
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-grow">
                Pull 6★ to 9★ Weapons, Armor, and Accessories.
              </p>

              {/* Action Button Indicator */}
              <div className="mt-auto">
                <Button
                  variant="primary"
                  className="w-full justify-center gap-2 pointer-events-none font-black uppercase tracking-wider text-xs py-3.5 bg-gradient-to-r from-accent-teal to-emerald-400 text-bg-primary border-none shadow-md shadow-accent-teal/15 group-hover:shadow-lg group-hover:shadow-accent-teal/35 group-hover:brightness-110 transition-all duration-300"
                >
                  <span> Click to Gacha</span>
                </Button>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
