import React, { useState } from 'react';
import { useGacha } from '../../hooks/useGacha';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface GuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ranger' | 'gear';
}

export default function GuaranteeModal({ isOpen, onClose, type }: GuaranteeModalProps) {
  const {
    currentBanner,
    rangerPityCount,
    gearPityCount,
    rangerBoxesClaimed,
    gearBox90Claimed,
    gearBox150Claimed,
    claimRangerGuarantee,
    claimGearGuarantee,
  } = useGacha();

  const [reward, setReward] = useState<any>(null);
  const [isUnboxing, setIsUnboxing] = useState<boolean>(false);

  if (!currentBanner) return null;

  const isGear = type === 'gear';
  const eventName = currentBanner.event ? `Event ${currentBanner.event}` : 'Current Event';

  // Calculate available Ranger boxes
  const rangerEarned = Math.floor(rangerPityCount / 100);
  const rangerAvailable = Math.max(0, rangerEarned - rangerBoxesClaimed);

  // Check Gear box availability
  const gearBox90Available = gearPityCount >= 90 && !gearBox90Claimed;
  const gearBox150Available = gearPityCount >= 150 && !gearBox150Claimed;

  const handleOpenRangerBox = async () => {
    if (rangerAvailable <= 0 || isUnboxing) return;
    setIsUnboxing(true);
    setReward(null);

    // Simulate opening animation delay
    setTimeout(async () => {
      try {
        const outcome = await claimRangerGuarantee();
        if (outcome) {
          setReward(outcome.item);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUnboxing(false);
      }
    }, 1500);
  };

  const handleOpenGearBox = async (milestone: 90 | 150) => {
    const isAvailable = milestone === 90 ? gearBox90Available : gearBox150Available;
    if (!isAvailable || isUnboxing) return;

    setIsUnboxing(true);
    setReward(null);

    setTimeout(async () => {
      try {
        const outcome = await claimGearGuarantee(milestone);
        if (outcome) {
          setReward(outcome.item);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUnboxing(false);
      }
    }, 1500);
  };

  const handleClose = () => {
    setReward(null);
    setIsUnboxing(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isGear ? 'Gear Guarantee System' : 'Ranger Guarantee System'}
      size="md"
    >
      <div className="flex flex-col items-center py-4 text-center">
        {isUnboxing ? (
          /* Unboxing Animation State */
          <div className="flex flex-col items-center justify-center min-h-[250px] w-full">
            <div className="relative w-24 h-24 mb-6">
              {/* Chest outline / orb with glowing backdrop */}
              <div className="absolute inset-0 bg-accent-cyan/25 blur-xl rounded-full animate-ping" />
              <div className="w-full h-full border-4 border-accent-cyan/80 bg-bg-secondary rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-accent-cyan/35 border-dashed animate-spin">
                🎁
              </div>
            </div>
            <h4 className="text-lg font-bold text-accent-cyan animate-pulse tracking-wide uppercase">
              UNBOXING GUARANTEE REWARD...
            </h4>
            <p className="text-xs text-text-secondary/60 mt-1">
              Adding item to your stats history
            </p>
          </div>
        ) : reward ? (
          /* Reward Reveal State */
          <div className="flex flex-col items-center min-h-[250px] animate-scaleIn w-full">
            <h4 className="text-xs font-bold text-accent-cyan tracking-wider uppercase mb-2">
              You Obtained!
            </h4>
            <div className="relative w-32 h-32 mb-4 p-1 rounded-2xl border-2 border-accent-cyan bg-bg-secondary/40 shadow-xl shadow-accent-cyan/15 flex items-center justify-center group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-accent-cyan/10 to-transparent pointer-events-none" />
              <img
                src={reward.image}
                alt={reward.name}
                className="w-24 h-24 object-contain drop-shadow-[0_0_8px_rgba(102,252,241,0.5)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://gachame.github.io/images/coupon-logo.png';
                }}
              />
            </div>
            <span className="px-2.5 py-0.5 border border-accent-cyan/35 bg-accent-cyan/10 text-accent-cyan text-[10px] font-black rounded-md uppercase tracking-wider mb-2">
              {reward.rarity.replace('_', ' ')} ★
            </span>
            <h3 className="text-xl font-black text-text-primary mb-6 tracking-tight">
              {reward.name}
            </h3>
            <Button variant="primary" onClick={() => setReward(null)} className="font-extrabold px-6">
              Claim & Continue
            </Button>
          </div>
        ) : (
          /* Default Status View */
          <div className="w-full flex flex-col items-center">
            {!isGear ? (
              /* Ranger Gacha Guarantee view */
              <div className="w-full flex flex-col items-center">
                <div className="text-6xl mb-4 animate-bounce">🎁</div>
                <h4 className="text-lg font-extrabold text-text-primary mb-1">
                  Ranger Pity Box
                </h4>
                <p className="text-xs text-text-secondary mb-6 max-w-sm">
                  Receive a random <span className="text-accent-cyan font-bold">8★ Event Ranger</span> of {eventName} for every 100 pulls. (6+1 counts as 6 pulls)
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-xs bg-bg-secondary border border-border-color rounded-full h-4 mb-2 overflow-hidden p-0.5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-accent-cyan to-accent-teal rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, rangerPityCount % 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-text-primary mix-blend-difference font-mono">
                    {rangerPityCount % 100} / 100
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary/60 mb-6 font-mono font-semibold">
                  Total Pulls: {rangerPityCount} • Claimed: {rangerBoxesClaimed}
                </div>

                {/* Claim action */}
                {rangerAvailable > 0 ? (
                  <Button
                    variant="primary"
                    onClick={handleOpenRangerBox}
                    className="w-full max-w-xs font-black uppercase tracking-wider py-3.5 shadow-lg shadow-accent-cyan/20 animate-pulse"
                  >
                    Open Guarantee Box ({rangerAvailable})
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full max-w-xs font-black uppercase tracking-wider py-3.5"
                  >
                    Locked ({100 - (rangerPityCount % 100)} pulls remaining)
                  </Button>
                )}
              </div>
            ) : (
              /* Gear Gacha Guarantee view */
              <div className="w-full flex flex-col items-center">
                <div className="text-6xl mb-4 animate-bounce">🎁</div>
                <h4 className="text-lg font-extrabold text-text-primary mb-1">
                  Gear Pity Milestones
                </h4>
                <p className="text-xs text-text-secondary mb-8 max-w-sm">
                  Receive a random <span className="text-accent-cyan font-bold">Event Gear</span> at 90 and 150 pulls. (5+1 counts as 5 pulls)
                </p>

                <div className="w-full max-w-sm flex flex-col gap-4">
                  {/* Milestone 90 Box */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border-color/80 bg-bg-secondary/40">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🎁</div>
                      <div className="text-left">
                        <div className="text-sm font-extrabold text-text-primary">
                          90 Pulls Milestone
                        </div>
                        <div className="text-[10px] text-text-secondary/60 font-mono">
                          Progress: {Math.min(90, gearPityCount)} / 90
                        </div>
                      </div>
                    </div>
                    {gearBox90Claimed ? (
                      <span className="text-xs font-bold text-text-secondary/40 uppercase">Claimed</span>
                    ) : gearBox90Available ? (
                      <Button variant="primary" size="sm" onClick={() => handleOpenGearBox(90)} className="font-extrabold uppercase shadow shadow-accent-cyan/15 animate-pulse">
                        Open
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-text-secondary/50 font-mono">
                        {Math.max(0, 90 - gearPityCount)} left
                      </span>
                    )}
                  </div>

                  {/* Milestone 150 Box */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border-color/80 bg-bg-secondary/40">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🎁</div>
                      <div className="text-left">
                        <div className="text-sm font-extrabold text-text-primary">
                          150 Pulls Milestone
                        </div>
                        <div className="text-[10px] text-text-secondary/60 font-mono">
                          Progress: {Math.min(150, gearPityCount)} / 150
                        </div>
                      </div>
                    </div>
                    {gearBox150Claimed ? (
                      <span className="text-xs font-bold text-text-secondary/40 uppercase">Claimed</span>
                    ) : gearBox150Available ? (
                      <Button variant="primary" size="sm" onClick={() => handleOpenGearBox(150)} className="font-extrabold uppercase shadow shadow-accent-cyan/15 animate-pulse">
                        Open
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-text-secondary/50 font-mono">
                        {Math.max(0, 150 - gearPityCount)} left
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary/60 mt-8 font-mono font-semibold">
                  Total Gear Pulls: {gearPityCount}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
