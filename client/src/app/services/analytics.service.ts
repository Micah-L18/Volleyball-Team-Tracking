import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { SkillRatingService, TeamSkillAverage, SkillRating } from './skill-rating.service';

export interface TeamAnalytics {
  totalPlayers: number;
  totalSkillsRated: number;
  overallTeamAverage: number;
  topStrengths: SkillStrength[];
  improvementAreas: SkillImprovement[];
  categoryBreakdown: CategoryAnalysis[];
  playerComparison: PlayerComparison[];
  progressData: ProgressData[];
}

export interface SkillStrength {
  skillName: string;
  category: string;
  averageRating: number;
  playerCount: number;
  percentageOfTeam: number;
}

export interface SkillImprovement {
  skillName: string;
  category: string;
  averageRating: number;
  playerCount: number;
  improvementPotential: number;
}

export interface CategoryAnalysis {
  category: string;
  averageRating: number;
  skillCount: number;
  ratedSkillCount: number;
  completionPercentage: number;
  topSkill: string;
  weakestSkill: string;
}

export interface PlayerComparison {
  playerId: number;
  playerName: string;
  overallAverage: number;
  strengthCategory: string;
  weakestCategory: string;
  totalSkillsRated: number;
}

export interface ProgressData {
  month: string;
  averageRating: number;
  skillsRated: number;
}

export interface InsightData {
  type: 'strength' | 'balanced' | 'improvement' | 'consistency';
  title: string;
  description: string;
  value: string;
  icon: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(
    private http: HttpClient,
    private skillRatingService: SkillRatingService
  ) {}

  getTeamAnalytics(teamId: number): Observable<TeamAnalytics> {
    return forkJoin({
      teamAverages: this.skillRatingService.getTeamSkillAverages(teamId),
      players: this.http.get<any[]>(`${environment.apiUrl}/players/team/${teamId}`),
      skills: this.skillRatingService.getSkills()
    }).pipe(
      map(({ teamAverages, players, skills }) => {
        return this.processTeamAnalytics(teamAverages, players, skills);
      })
    );
  }

  private processTeamAnalytics(
    teamAverages: TeamSkillAverage[],
    players: any[],
    skills: any[]
  ): TeamAnalytics {
    const totalPlayers = players.length;
    const totalSkillsRated = teamAverages.length;
    
    // Calculate overall team average
    // Ensure average_rating is converted to number in case it comes as string from DB
    const overallTeamAverage = teamAverages.length > 0 
      ? teamAverages.reduce((sum, skill) => {
          const rating = typeof skill.average_rating === 'string' 
            ? parseFloat(skill.average_rating) 
            : skill.average_rating;
          return sum + (isNaN(rating) ? 0 : rating);
        }, 0) / teamAverages.length
      : 0;

    // Identify top strengths (ratings >= 4.0)
    const topStrengths: SkillStrength[] = teamAverages
      .map(skill => ({
        ...skill,
        average_rating: typeof skill.average_rating === 'string' 
          ? parseFloat(skill.average_rating) 
          : skill.average_rating
      }))
      .filter(skill => !isNaN(skill.average_rating) && skill.average_rating >= 4.0)
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 5)
      .map(skill => ({
        skillName: skill.skill_name,
        category: skill.skill_category,
        averageRating: Number((skill.average_rating).toFixed(1)),
        playerCount: skill.player_count,
        percentageOfTeam: (skill.player_count / totalPlayers) * 100
      }));

    // Identify improvement areas (ratings < 3.0)
    const improvementAreas: SkillImprovement[] = teamAverages
      .map(skill => ({
        ...skill,
        average_rating: typeof skill.average_rating === 'string' 
          ? parseFloat(skill.average_rating) 
          : skill.average_rating
      }))
      .filter(skill => !isNaN(skill.average_rating) && skill.average_rating < 3.0)
      .sort((a, b) => a.average_rating - b.average_rating)
      .slice(0, 5)
      .map(skill => ({
        skillName: skill.skill_name,
        category: skill.skill_category,
        averageRating: Number((skill.average_rating).toFixed(1)),
        playerCount: skill.player_count,
        improvementPotential: Number((5.0 - skill.average_rating).toFixed(1))
      }));

    // Category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(teamAverages, skills);

    // Player comparison (placeholder - would need individual player data)
    const playerComparison: PlayerComparison[] = [];

    // Progress data (placeholder - would need historical data)
    const progressData: ProgressData[] = [];

    return {
      totalPlayers,
      totalSkillsRated,
      overallTeamAverage: Number((isNaN(overallTeamAverage) ? 0 : overallTeamAverage).toFixed(1)),
      topStrengths,
      improvementAreas,
      categoryBreakdown,
      playerComparison,
      progressData
    };
  }

  private calculateCategoryBreakdown(teamAverages: TeamSkillAverage[], allSkills: any[]): CategoryAnalysis[] {
    const categories = [...new Set(allSkills.map(skill => skill.category))];
    
    return categories.map(category => {
      const categorySkills = allSkills.filter(skill => skill.category === category);
      const categoryRatings = teamAverages.filter(rating => rating.skill_category === category);
      
      // Convert average_rating to number and handle NaN cases
      const validRatings = categoryRatings.map(rating => {
        const numRating = typeof rating.average_rating === 'string' 
          ? parseFloat(rating.average_rating) 
          : rating.average_rating;
        return { ...rating, average_rating: isNaN(numRating) ? 0 : numRating };
      });
      
      const averageRating = validRatings.length > 0
        ? validRatings.reduce((sum, rating) => sum + rating.average_rating, 0) / validRatings.length
        : 0;
      
      const topSkill = validRatings.length > 0
        ? validRatings.reduce((prev, current) => 
            prev.average_rating > current.average_rating ? prev : current
          ).skill_name
        : 'None rated';
      
      const weakestSkill = validRatings.length > 0
        ? validRatings.reduce((prev, current) => 
            prev.average_rating < current.average_rating ? prev : current
          ).skill_name
        : 'None rated';

      return {
        category,
        averageRating: Number((averageRating).toFixed(1)),
        skillCount: categorySkills.length,
        ratedSkillCount: categoryRatings.length,
        completionPercentage: (categoryRatings.length / categorySkills.length) * 100,
        topSkill,
        weakestSkill
      };
    });
  }

  generateInsights(analytics: TeamAnalytics): InsightData[] {
    const insights: InsightData[] = [];

    // Top strength insight
    if (analytics.topStrengths.length > 0) {
      const topStrength = analytics.topStrengths[0];
      insights.push({
        type: 'strength',
        title: 'Team Strength',
        description: `${topStrength.skillName} is your team's strongest skill`,
        value: `${topStrength.averageRating}/5.0`,
        icon: '💪',
        color: 'text-green-600'
      });
    }

    // Balanced team insight
    const balancedCategories = analytics.categoryBreakdown.filter(
      cat => cat.averageRating >= 3.5 && cat.averageRating <= 4.0
    );
    if (balancedCategories.length >= 3) {
      insights.push({
        type: 'balanced',
        title: 'Well-Balanced Team',
        description: `Strong performance across ${balancedCategories.length} skill categories`,
        value: `${balancedCategories.length} categories`,
        icon: '⚖️',
        color: 'text-blue-600'
      });
    }

    // Improvement area insight
    if (analytics.improvementAreas.length > 0) {
      const topImprovement = analytics.improvementAreas[0];
      insights.push({
        type: 'improvement',
        title: 'Focus Area',
        description: `${topImprovement.skillName} needs the most attention`,
        value: `${topImprovement.averageRating}/5.0`,
        icon: '🎯',
        color: 'text-orange-600'
      });
    }

    // Consistency insight
    const overallAvg = analytics.overallTeamAverage;
    if (overallAvg >= 3.5) {
      insights.push({
        type: 'consistency',
        title: 'Consistent Performance',
        description: 'Team shows solid fundamentals across skills',
        value: `${overallAvg}/5.0`,
        icon: '🏆',
        color: 'text-purple-600'
      });
    }

    return insights;
  }

  exportTeamReport(teamId: number, teamName: string): Observable<Blob> {
    return this.getTeamAnalytics(teamId).pipe(
      map(analytics => {
        const reportData = this.generateReportData(analytics, teamName);
        return new Blob([reportData], { type: 'text/plain' });
      })
    );
  }

  private generateReportData(analytics: TeamAnalytics, teamName: string): string {
    const date = new Date().toLocaleDateString();
    
    let report = `VOLLEYBALL TEAM ANALYTICS REPORT\n`;
    report += `Team: ${teamName}\n`;
    report += `Date: ${date}\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `TEAM OVERVIEW\n`;
    report += `Total Players: ${analytics.totalPlayers}\n`;
    report += `Skills Rated: ${analytics.totalSkillsRated}\n`;
    report += `Overall Average: ${analytics.overallTeamAverage}/5.0\n\n`;
    report += `TOP STRENGTHS\n`;
    analytics.topStrengths.forEach((strength, index) => {
      report += `${index + 1}. ${strength.skillName} (${strength.category}): ${strength.averageRating}/5.0\n`;
    });
    report += `\n`;
    
    report += `IMPROVEMENT AREAS\n`;
    analytics.improvementAreas.forEach((area, index) => {
      report += `${index + 1}. ${area.skillName} (${area.category}): ${area.averageRating}/5.0\n`;
    });
    report += `\n`;
    
    report += `CATEGORY BREAKDOWN\n`;
    analytics.categoryBreakdown.forEach(category => {
      report += `${category.category}: ${category.averageRating}/5.0 (${category.completionPercentage.toFixed(1)}% complete)\n`;
    });
    
    return report;
  }
}
