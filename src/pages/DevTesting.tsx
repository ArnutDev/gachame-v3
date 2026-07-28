import React, { useState, useEffect } from 'react';
import { loadBanners, loadCombinedRangers, loadCombinedGears } from '../services/dataLoader';
import { rollMultiGacha, calculateItemProbabilities, generatePoolByRarity } from '../engine/gachaEngine';
import { Banner, Ranger, Gear, RangerRarity, GearRarity } from '../types';

export default function DevTesting() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [itemsPool, setItemsPool] = useState<(Ranger | Gear)[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation outcome states
  const [totalPulls, setTotalPulls] = useState(0);
  const [rarityStats, setRarityStats] = useState<any[]>([]);
  const [itemStats, setItemStats] = useState<any[]>([]);

  // Load initial banner options
  useEffect(() => {
    async function fetchBanners() {
      try {
        setLoadingBanners(true);
        const data = await loadBanners();
        setBanners(data);
        if (data.length > 0) {
          setSelectedBanner(data[0]);
        }
      } catch (err: any) {
        setError('Failed to load banners: ' + err.message);
      } finally {
        setLoadingBanners(false);
      }
    }
    fetchBanners();
  }, []);

  // Fetch full items pool when active banner changes
  useEffect(() => {
    if (!selectedBanner) return;

    async function fetchPool() {
      try {
        setLoading(true);
        const isGear = selectedBanner.type === 'gear';
        let pool: (Ranger | Gear)[] = [];

        if (isGear) {
          const rarities: GearRarity[] = ['5', '6', '7', '8', '9'];
          const pools = await Promise.all(
            rarities.map((r) => loadCombinedGears(r, selectedBanner.event))
          );
          pool = pools.flat();
        } else {
          const rarities: RangerRarity[] = ['7_normal', '7_ultra', '8_normal', '8_ultra'];
          const pools = await Promise.all(
            rarities.map((r) => loadCombinedRangers(r, selectedBanner.event))
          );
          pool = pools.flat();
        }

        setItemsPool(pool);
        // Clear old results
        setTotalPulls(0);
        setRarityStats([]);
        setItemStats([]);
        setError(null);
      } catch (err: any) {
        setError('Failed to construct pool: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPool();
  }, [selectedBanner]);

  const runSimulation = (count: number) => {
    if (!selectedBanner || itemsPool.length === 0) return;
    setLoading(true);
    setError(null);

    // Timeout allows rendering components to repaint for loading indicators
    setTimeout(() => {
      try {
        const outcomes = rollMultiGacha(selectedBanner, itemsPool, count);

        // Count rolls per rarity and ID
        const rarityCounts: Record<string, number> = {};
        const itemCounts: Record<string, number> = {};

        outcomes.forEach((o) => {
          rarityCounts[o.rarity] = (rarityCounts[o.rarity] || 0) + 1;
          itemCounts[o.item.id] = (itemCounts[o.item.id] || 0) + 1;
        });

        // 1. Compile Rarity Stats
        const isGear = selectedBanner.type === 'gear';
        const relevantRarities: (RangerRarity | GearRarity)[] = isGear
          ? ['9', '8', '7', '6', '5']
          : ['8_ultra', '8_normal', '7_ultra', '7_normal'];

        const computedRarityStats = relevantRarities.map((r) => {
          const expected = selectedBanner.rarityRates[r] || 0;
          const actualCount = rarityCounts[r] || 0;
          const actualPercentage = count > 0 ? (actualCount / count) * 100 : 0;
          return {
            rarity: r,
            expected,
            actualCount,
            actualPercentage,
          };
        });

        // 2. Compile Item Stats with expected calculation
        const computedItemStats = itemsPool.map((item) => {
          const rarity = item.rarity;
          const rarityRate = selectedBanner.rarityRates[rarity] || 0;
          const rarityPool = generatePoolByRarity(itemsPool, rarity);

          const probabilitiesMap = calculateItemProbabilities(
            rarityPool,
            rarityRate,
            selectedBanner.featuredItems,
            selectedBanner.featuredRates
          );

          const expected = probabilitiesMap.get(item.id) || 0;
          const actualCount = itemCounts[item.id] || 0;
          const actualPercentage = count > 0 ? (actualCount / count) * 100 : 0;
          const isFeatured = selectedBanner.featuredItems.includes(item.id);

          return {
            id: item.id,
            name: item.name,
            rarity: item.rarity,
            isFeatured,
            expected,
            actualCount,
            actualPercentage,
          };
        });

        // Sort items by count descending, then expected rate descending
        computedItemStats.sort((a, b) => b.actualCount - a.actualCount || b.expected - a.expected);

        setTotalPulls(count);
        setRarityStats(computedRarityStats);
        setItemStats(computedItemStats);
      } catch (err: any) {
        setError('Simulation error: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const formatRarityLabel = (rarity: string) => {
    switch (rarity) {
      case '8_ultra': return '8★ Ultra';
      case '8_normal': return '8★ Normal';
      case '7_ultra': return '7★ Ultra';
      case '7_normal': return '7★ Normal';
      default: return `${rarity}★`;
    }
  };

  if (loadingBanners) {
    return <div className="loading-state">Loading banners...</div>;
  }

  return (
    <div className="dev-page">
      <div className="dev-header">
        <h1>Gacha Engine Developer Console</h1>
        <p className="subtitle">Run mass simulations to verify probability engine distribution accuracy.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dev-grid">
        {/* Banner Configuration Selector Card */}
        <div className="dev-card config-card">
          <h2>Banner Select & Configuration</h2>
          <div className="form-group">
            <label htmlFor="banner-select">Active Banner</label>
            <select
              id="banner-select"
              value={selectedBanner?.id || ''}
              onChange={(e) => {
                const banner = banners.find((b) => b.id === e.target.value);
                if (banner) setSelectedBanner(banner);
              }}
              disabled={loading}
            >
              {banners.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {selectedBanner && (
            <div className="banner-details">
              <div className="detail-row">
                <strong>Type:</strong> <span className="type-badge">{selectedBanner.type.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <strong>Associated Event:</strong> <span>{selectedBanner.event || 'None (Permanent)'}</span>
              </div>
              <div className="detail-row">
                <strong>Total Items in Pool:</strong> <span>{itemsPool.length}</span>
              </div>
              <div className="rarity-rates-list">
                <strong>Configured Rates:</strong>
                <ul>
                  {Object.entries(selectedBanner.rarityRates)
                    .filter(([_, rate]) => rate > 0)
                    .map(([rarity, rate]) => (
                      <li key={rarity}>
                        {formatRarityLabel(rarity)}: <span className="rate-text">{rate}%</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Pull Actions Controller Card */}
        <div className="dev-card actions-card">
          <h2>Run Simulation</h2>
          <p>Choose pull count to run rolls through the engine in a single batch.</p>
          <div className="pull-buttons-grid">
            <button className="btn-pull" onClick={() => runSimulation(100)} disabled={loading || !selectedBanner}>
              100 Pulls
            </button>
            <button className="btn-pull" onClick={() => runSimulation(1000)} disabled={loading || !selectedBanner}>
              1,000 Pulls
            </button>
            <button className="btn-pull" onClick={() => runSimulation(10000)} disabled={loading || !selectedBanner}>
              10,000 Pulls
            </button>
            <button className="btn-pull btn-heavy" onClick={() => runSimulation(100000)} disabled={loading || !selectedBanner}>
              100,000 Pulls
            </button>
          </div>
          {loading && (
            <div className="simulation-loader">
              <div className="spinner"></div>
              <span>Simulating rolls & calculating stats...</span>
            </div>
          )}
        </div>
      </div>

      {totalPulls > 0 && !loading && (
        <div className="stats-results">
          <h2>Simulation Results (Total Pulls: {totalPulls.toLocaleString()})</h2>

          <div className="results-grid">
            {/* Rarity statistics table */}
            <div className="dev-card table-card">
              <h3>Rarity Distribution</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Rarity</th>
                    <th>Expected Rate</th>
                    <th>Actual Rate</th>
                    <th>Count</th>
                    <th>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {rarityStats.map((stat) => {
                    const delta = stat.actualPercentage - stat.expected;
                    const deltaClass = delta > 0 ? 'delta-plus' : delta < 0 ? 'delta-minus' : '';
                    return (
                      <tr key={stat.rarity}>
                        <td><strong>{formatRarityLabel(stat.rarity)}</strong></td>
                        <td>{stat.expected.toFixed(2)}%</td>
                        <td>{stat.actualPercentage.toFixed(2)}%</td>
                        <td>{stat.actualCount.toLocaleString()}</td>
                        <td className={deltaClass}>{delta > 0 ? '+' : ''}{delta.toFixed(3)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Individual Item statistics table */}
            <div className="dev-card table-card">
              <h3>Individual Item Details</h3>
              <div className="scrollable-table-wrapper">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Rarity</th>
                      <th>Status</th>
                      <th>Expected Rate</th>
                      <th>Actual Rate</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemStats.map((stat) => (
                      <tr key={stat.id} className={stat.isFeatured ? 'featured-row' : ''}>
                        <td>
                          <span className="item-name">{stat.name}</span>
                          <span className="item-id-sub">{stat.id}</span>
                        </td>
                        <td>{formatRarityLabel(stat.rarity)}</td>
                        <td>
                          {stat.isFeatured ? (
                            <span className="badge-featured">FEATURED</span>
                          ) : (
                            <span className="badge-normal">Normal</span>
                          )}
                        </td>
                        <td>{stat.expected.toFixed(3)}%</td>
                        <td>{stat.actualPercentage.toFixed(3)}%</td>
                        <td>{stat.actualCount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
