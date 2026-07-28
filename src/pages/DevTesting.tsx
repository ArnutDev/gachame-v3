import React, { useState, useEffect } from 'react';
import { loadBanners, loadCombinedRangers, loadCombinedGears } from '../services/dataLoader';
import {
  runEngineUnitTests,
  runEngineBenchmark,
  generateEngineStatisticalReport,
  TestCaseResult,
  BenchmarkResult,
  StatisticalReport,
} from '../utils/engineDiagnostics';
import { Banner, Ranger, Gear, RangerRarity, GearRarity } from '../types';

export default function DevTesting() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [itemsPool, setItemsPool] = useState<(Ranger | Gear)[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Diagnostics states
  const [unitTests, setUnitTests] = useState<TestCaseResult[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [benchmarking, setBenchmarking] = useState(false);

  // Simulation outcomes
  const [totalPulls, setTotalPulls] = useState(0);
  const [rarityStats, setRarityStats] = useState<any[]>([]);
  const [itemStats, setItemStats] = useState<any[]>([]);

  // Load banners on mount
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

  // Load items pool & run unit tests when banner changes
  useEffect(() => {
    if (!selectedBanner) return;

    async function fetchPoolAndTest() {
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

        // Run Engine Unit Tests immediately
        const testResults = runEngineUnitTests(selectedBanner, pool);
        setUnitTests(testResults);

        // Reset previous run stats
        setTotalPulls(0);
        setRarityStats([]);
        setItemStats([]);
        setBenchmarks([]);
        setError(null);
      } catch (err: any) {
        setError('Failed to compile pool or execute tests: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPoolAndTest();
  }, [selectedBanner]);

  const runSimulation = (count: number) => {
    if (!selectedBanner || itemsPool.length === 0) return;
    setLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const report = generateEngineStatisticalReport(selectedBanner, itemsPool, count);
        setTotalPulls(report.totalPulls);
        setRarityStats(report.rarityStats);
        setItemStats(report.itemStats);
      } catch (err: any) {
        setError('Simulation error: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const runBenchmarks = () => {
    if (!selectedBanner || itemsPool.length === 0) return;
    setBenchmarking(true);
    setError(null);

    setTimeout(() => {
      try {
        const result100k = runEngineBenchmark(selectedBanner, itemsPool, 100000);
        const result1M = runEngineBenchmark(selectedBanner, itemsPool, 1000000);
        setBenchmarks([result100k, result1M]);
      } catch (err: any) {
        setError('Benchmarking error: ' + err.message);
      } finally {
        setBenchmarking(false);
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
        <p className="subtitle">Run unit tests, verify performance, and validate statistical rates.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dev-grid">
        {/* Banner selector & configurations */}
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
              disabled={loading || benchmarking}
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

        {/* Engine Diagnostics (Unit Tests & Benchmarks) */}
        <div className="dev-card diagnostics-card">
          <h2>Engine Diagnostics</h2>
          <div className="unit-tests-section">
            <h3>Unit Tests Results</h3>
            <div className="tests-list">
              {unitTests.map((t, idx) => (
                <div key={idx} className={`test-item ${t.passed ? 'test-pass' : 'test-fail'}`}>
                  <span className="test-status-icon">{t.passed ? '✔' : '✘'}</span>
                  <div className="test-item-body">
                    <strong>{t.name}</strong>
                    <span className="test-message">{t.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="benchmarks-section">
            <h3>Performance Benchmark</h3>
            <button
              className="btn-pull"
              style={{ width: '100%', marginBottom: '0.75rem' }}
              onClick={runBenchmarks}
              disabled={loading || benchmarking || !selectedBanner}
            >
              {benchmarking ? 'Running Benchmarks...' : 'Run Speed Benchmarks (100k & 1M)'}
            </button>

            {benchmarks.length > 0 && (
              <table className="stats-table mini-table">
                <thead>
                  <tr>
                    <th>Pulls</th>
                    <th>Time</th>
                    <th>Pulls / Sec</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.map((b, idx) => (
                    <tr key={idx}>
                      <td>{b.pullCount.toLocaleString()}</td>
                      <td>{b.timeMs.toFixed(1)} ms</td>
                      <td className="rate-text">{Math.round(b.pullsPerSecond).toLocaleString()} /s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pull Actions Controller Card */}
        <div className="dev-card actions-card" style={{ gridColumn: '1 / -1' }}>
          <h2>Statistical Rate Simulation</h2>
          <p>Execute pull operations and compare actual results against mathematical expectations.</p>
          <div className="pull-buttons-grid flex-buttons">
            <button className="btn-pull" onClick={() => runSimulation(100)} disabled={loading || benchmarking || !selectedBanner}>
              100 Pulls
            </button>
            <button className="btn-pull" onClick={() => runSimulation(1000)} disabled={loading || benchmarking || !selectedBanner}>
              1,000 Pulls
            </button>
            <button className="btn-pull" onClick={() => runSimulation(10000)} disabled={loading || benchmarking || !selectedBanner}>
              10,000 Pulls
            </button>
            <button className="btn-pull" onClick={() => runSimulation(100000)} disabled={loading || benchmarking || !selectedBanner}>
              100,000 Pulls
            </button>
            <button className="btn-pull btn-heavy" onClick={() => runSimulation(1000000)} disabled={loading || benchmarking || !selectedBanner}>
              1,000,000 Pulls (Statistical Verification)
            </button>
          </div>
          {loading && (
            <div className="simulation-loader">
              <div className="spinner"></div>
              <span>Simulating rolls & generating reports...</span>
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
                    const delta = stat.delta;
                    const deltaClass = delta > 0 ? 'delta-plus' : delta < 0 ? 'delta-minus' : '';
                    return (
                      <tr key={stat.rarity}>
                        <td><strong>{formatRarityLabel(stat.rarity)}</strong></td>
                        <td>{stat.expected.toFixed(2)}%</td>
                        <td>{stat.actual.toFixed(2)}%</td>
                        <td>{stat.count.toLocaleString()}</td>
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
                      <th>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemStats.map((stat) => {
                      const delta = stat.delta;
                      const deltaClass = delta > 0 ? 'delta-plus' : delta < 0 ? 'delta-minus' : '';
                      return (
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
                          <td>{stat.actual.toFixed(3)}%</td>
                          <td>{stat.count.toLocaleString()}</td>
                          <td className={deltaClass}>{delta > 0 ? '+' : ''}{delta.toFixed(4)}%</td>
                        </tr>
                      );
                    })}
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
