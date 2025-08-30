/**
 * Advanced Statistical Analysis Service
 * Provides comprehensive volleyball analytics and performance insights
 */

class StatisticalAnalysisService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Calculate comprehensive performance rating for a player
   * @param {Object} playerStats - Player statistics object
   * @returns {number} Performance rating (0-100)
   */
  calculatePlayerPerformanceRating(playerStats) {
    if (!playerStats || !playerStats.length) return 0;

    const categoryWeights = {
      'attacking': 0.25,
      'serving': 0.20,
      'blocking': 0.15,
      'passing': 0.15,
      'setting': 0.15,
      'digging': 0.10
    };

    let totalRating = 0;
    let totalWeight = 0;

    // Group stats by category
    const categorizedStats = this.groupStatsByCategory(playerStats);

    for (const [category, stats] of Object.entries(categorizedStats)) {
      const categoryRating = this.calculateCategoryRating(category, stats);
      const weight = categoryWeights[category] || 0.1;
      
      totalRating += categoryRating * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(totalRating / totalWeight) : 0;
  }

  /**
   * Calculate rating for a specific category
   * @param {string} category - Stat category
   * @param {Array} stats - Array of stats for the category
   * @returns {number} Category rating (0-100)
   */
  calculateCategoryRating(category, stats) {
    if (!stats || !stats.length) return 0;

    switch (category) {
      case 'attacking':
        return this.calculateAttackingRating(stats);
      case 'serving':
        return this.calculateServingRating(stats);
      case 'blocking':
        return this.calculateBlockingRating(stats);
      case 'passing':
        return this.calculatePassingRating(stats);
      case 'setting':
        return this.calculateSettingRating(stats);
      case 'digging':
        return this.calculateDiggingRating(stats);
      default:
        return this.calculateGenericRating(stats);
    }
  }

  /**
   * Calculate attacking performance rating
   * @param {Array} stats - Attacking statistics
   * @returns {number} Rating (0-100)
   */
  calculateAttackingRating(stats) {
    const kills = this.getStatValue(stats, 'kills') || 0;
    const errors = this.getStatValue(stats, 'errors') || 0;
    const attempts = this.getStatValue(stats, 'attempts') || 1;
    
    // Attack efficiency formula: (kills - errors) / attempts
    const efficiency = (kills - errors) / attempts;
    
    // Convert to 0-100 scale (excellent efficiency is around 0.3+)
    const efficiencyRating = Math.min(efficiency * 250, 100);
    
    // Factor in kill count relative to attempts
    const killRate = kills / attempts;
    const killRating = Math.min(killRate * 200, 100);
    
    // Combine efficiency (70%) and kill rate (30%)
    return Math.max(0, Math.round(efficiencyRating * 0.7 + killRating * 0.3));
  }

  /**
   * Calculate serving performance rating
   * @param {Array} stats - Serving statistics
   * @returns {number} Rating (0-100)
   */
  calculateServingRating(stats) {
    const aces = this.getStatValue(stats, 'aces') || 0;
    const errors = this.getStatValue(stats, 'service_errors') || 0;
    const attempts = this.getStatValue(stats, 'service_attempts') || 1;
    
    // Serve efficiency: (aces - errors) / attempts
    const efficiency = (aces - errors) / attempts;
    const efficiencyRating = Math.min((efficiency + 0.1) * 500, 100);
    
    // Ace rate
    const aceRate = aces / attempts;
    const aceRating = Math.min(aceRate * 1000, 100);
    
    return Math.max(0, Math.round(efficiencyRating * 0.6 + aceRating * 0.4));
  }

  /**
   * Calculate blocking performance rating
   * @param {Array} stats - Blocking statistics
   * @returns {number} Rating (0-100)
   */
  calculateBlockingRating(stats) {
    const soloBlocks = this.getStatValue(stats, 'solo_blocks') || 0;
    const assistBlocks = this.getStatValue(stats, 'block_assists') || 0;
    const errors = this.getStatValue(stats, 'block_errors') || 0;
    
    const totalBlocks = soloBlocks + (assistBlocks * 0.5);
    const efficiency = Math.max(0, totalBlocks - errors);
    
    // Scale based on typical blocking numbers
    return Math.min(efficiency * 25, 100);
  }

  /**
   * Calculate passing performance rating
   * @param {Array} stats - Passing statistics
   * @returns {number} Rating (0-100)
   */
  calculatePassingRating(stats) {
    const perfect = this.getStatValue(stats, 'perfect_passes') || 0;
    const good = this.getStatValue(stats, 'good_passes') || 0;
    const poor = this.getStatValue(stats, 'poor_passes') || 0;
    const total = perfect + good + poor || 1;
    
    // Weighted passing score
    const score = (perfect * 3 + good * 2 + poor * 1) / (total * 3);
    return Math.round(score * 100);
  }

  /**
   * Calculate setting performance rating
   * @param {Array} stats - Setting statistics
   * @returns {number} Rating (0-100)
   */
  calculateSettingRating(stats) {
    const assists = this.getStatValue(stats, 'assists') || 0;
    const errors = this.getStatValue(stats, 'setting_errors') || 0;
    const attempts = this.getStatValue(stats, 'setting_attempts') || 1;
    
    const efficiency = (assists - errors) / attempts;
    return Math.max(0, Math.min(efficiency * 100 + 50, 100));
  }

  /**
   * Calculate digging performance rating
   * @param {Array} stats - Digging statistics
   * @returns {number} Rating (0-100)
   */
  calculateDiggingRating(stats) {
    const digs = this.getStatValue(stats, 'digs') || 0;
    const attempts = this.getStatValue(stats, 'dig_attempts') || Math.max(digs, 1);
    
    const efficiency = digs / attempts;
    return Math.min(efficiency * 120, 100);
  }

  /**
   * Calculate generic rating for unknown categories
   * @param {Array} stats - Statistics array
   * @returns {number} Rating (0-100)
   */
  calculateGenericRating(stats) {
    if (!stats.length) return 0;
    
    const avgValue = stats.reduce((sum, stat) => sum + (stat.stat_value || 0), 0) / stats.length;
    return Math.min(avgValue * 2, 100);
  }

  /**
   * Group statistics by category
   * @param {Array} stats - Array of statistics
   * @returns {Object} Grouped statistics
   */
  groupStatsByCategory(stats) {
    return stats.reduce((groups, stat) => {
      const category = stat.stat_category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(stat);
      return groups;
    }, {});
  }

  /**
   * Get specific stat value from stats array
   * @param {Array} stats - Statistics array
   * @param {string} statName - Name of the statistic
   * @returns {number} Stat value
   */
  getStatValue(stats, statName) {
    const stat = stats.find(s => s.stat_name === statName);
    return stat ? stat.stat_value : 0;
  }

  /**
   * Analyze performance trends
   * @param {Array} trends - Trend data from database
   * @returns {Object} Enhanced trend analysis
   */
  analyzeTrends(trends) {
    const analysisResults = {
      improving: [],
      declining: [],
      stable: [],
      insights: []
    };

    trends.forEach(trend => {
      const changePercent = parseFloat(trend.change_percentage) || 0;
      
      if (changePercent > 5) {
        analysisResults.improving.push(trend);
      } else if (changePercent < -5) {
        analysisResults.declining.push(trend);
      } else {
        analysisResults.stable.push(trend);
      }
    });

    // Generate insights
    if (analysisResults.improving.length > analysisResults.declining.length) {
      analysisResults.insights.push({
        type: 'positive',
        message: `Team showing strong improvement with ${analysisResults.improving.length} metrics trending upward`,
        priority: 'info'
      });
    }

    if (analysisResults.declining.length > 3) {
      analysisResults.insights.push({
        type: 'warning',
        message: `${analysisResults.declining.length} performance areas need attention`,
        priority: 'high'
      });
    }

    return analysisResults;
  }

  /**
   * Generate coaching recommendations based on analysis
   * @param {Object} analysisData - Complete analysis data
   * @returns {Array} Array of recommendations
   */
  generateCoachingRecommendations(analysisData) {
    const recommendations = [];

    // Analyze declining trends
    if (analysisData.trends) {
      const decliningTrends = analysisData.trends.filter(t => t.trend_direction === 'declining');
      
      decliningTrends.forEach(trend => {
        if (trend.stat_category === 'attacking') {
          recommendations.push({
            type: 'drill',
            priority: 'high',
            title: 'Attack Efficiency Drill',
            description: 'Focus on approach timing and contact point consistency',
            category: 'attacking',
            estimatedImprovement: '10-15%',
            duration: '30 minutes',
            frequency: '3x per week'
          });
        } else if (trend.stat_category === 'serving') {
          recommendations.push({
            type: 'technique',
            priority: 'medium',
            title: 'Serve Consistency Training',
            description: 'Work on toss consistency and follow-through',
            category: 'serving',
            estimatedImprovement: '8-12%',
            duration: '20 minutes',
            frequency: '4x per week'
          });
        }
      });
    }

    // Analyze category performance
    if (analysisData.categoryAnalysis) {
      analysisData.categoryAnalysis.forEach(category => {
        if (category.average_value < 50) {
          recommendations.push({
            type: 'focus_area',
            priority: 'high',
            title: `${category.stat_category} Development`,
            description: `Below-average performance in ${category.stat_category} requires focused attention`,
            category: category.stat_category,
            estimatedImprovement: '15-20%',
            duration: '45 minutes',
            frequency: '2x per week'
          });
        }
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Calculate team chemistry score
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} Chemistry analysis
   */
  async calculateTeamChemistry(teamId) {
    try {
      // This would require more complex queries to analyze player combinations
      // For now, return mock data structure
      return {
        overallChemistry: Math.round(Math.random() * 30 + 70),
        bestCombinations: [
          {
            players: ['Player A', 'Player B', 'Player C'],
            efficiency: Math.round(Math.random() * 20 + 80),
            gamesPlayed: Math.round(Math.random() * 10 + 5)
          }
        ],
        recommendations: [
          'Try rotating Player X with Player Y in key moments',
          'Focus on timing between setter and outside hitters'
        ]
      };
    } catch (error) {
      console.error('Error calculating team chemistry:', error);
      return null;
    }
  }

  /**
   * Predict injury risk based on workload and performance data
   * @param {number} playerId - Player ID
   * @returns {Promise<Object>} Risk assessment
   */
  async assessInjuryRisk(playerId) {
    try {
      // This would analyze workload, performance drops, etc.
      // Mock implementation
      const riskLevel = Math.random();
      
      return {
        riskLevel: riskLevel < 0.3 ? 'low' : riskLevel < 0.7 ? 'medium' : 'high',
        riskPercentage: Math.round(riskLevel * 100),
        factors: [
          'High training load last 2 weeks',
          'Slight performance decline in jumping stats'
        ],
        recommendations: [
          'Consider reducing training intensity',
          'Focus on recovery protocols'
        ]
      };
    } catch (error) {
      console.error('Error assessing injury risk:', error);
      return null;
    }
  }

  /**
   * Generate performance benchmarks
   * @param {string} position - Player position
   * @param {string} level - Competition level
   * @returns {Object} Benchmark data
   */
  generateBenchmarks(position = 'all', level = 'college') {
    const benchmarks = {
      attacking: {
        efficiency: { excellent: 0.35, good: 0.25, average: 0.15, poor: 0.05 },
        killsPerSet: { excellent: 4.5, good: 3.5, average: 2.5, poor: 1.5 }
      },
      serving: {
        aceRate: { excellent: 0.15, good: 0.10, average: 0.06, poor: 0.03 },
        errorRate: { excellent: 0.05, good: 0.08, average: 0.12, poor: 0.18 }
      },
      blocking: {
        blocksPerSet: { excellent: 1.5, good: 1.0, average: 0.6, poor: 0.3 }
      },
      passing: {
        efficiency: { excellent: 2.8, good: 2.5, average: 2.2, poor: 1.8 }
      }
    };

    return benchmarks;
  }

  /**
   * Calculate consistency score for a player
   * @param {Array} stats - Player statistics over time
   * @returns {number} Consistency score (0-100)
   */
  calculateConsistencyScore(stats) {
    if (!stats || stats.length < 3) return 0;

    const values = stats.map(s => s.stat_value).filter(v => v != null);
    if (values.length < 3) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation relative to mean indicates higher consistency
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    
    // Convert to 0-100 scale (lower CV = higher consistency)
    return Math.max(0, Math.round(100 - (coefficientOfVariation * 100)));
  }
}

module.exports = StatisticalAnalysisService;
