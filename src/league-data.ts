import { ReadStream } from 'fs';
import readline from 'readline';
import { logger, pluralize } from './utils';

interface GameGoals {
  teamOneName: string;
  teamOneGoals: number;
  teamTwoName: string;
  teamTwoGoals: number;
}

type GamePoints = {
  team: string;
  points: number;
}[]

interface TeamPoints {
  [teamName: string]: number[];
}

/**
 * LeagueData takes a read stream and parses the match data to calculate
 * the expected console output (top 3 teams per match day).
 *
 * It assumes that once it sees a teamname repeat, we have moved onto the
 * next match day.
 */
class LeagueData {
  currentMatchDay: number = 1;
  lineNumber: number = 0;
  teamPoints: TeamPoints = {};

  constructor(readStream?: ReadStream) {
    if (readStream) {
      const readInterface = readline.createInterface({ input: readStream });
      readInterface.on('line',
        (line: string) => this.handleLine(line)
      );

      readInterface.on('close', () => this.logTopTeams());
    }
  }

  handleLine(line: string) {
    const goals = this.parseGoals(line);
    const points = this.calculatePoints(goals);

    points.forEach(({ team, points }) => {
      const existingTeamData = this.teamPoints[team];

      if (!existingTeamData) {
        this.teamPoints[team] = [points];
        return
      }

      if (existingTeamData.length === this.currentMatchDay) {
        this.logTopTeams();
        this.currentMatchDay++;
      }

      this.teamPoints[team] = [...existingTeamData, points];
    });

    this.lineNumber++;
  }

  parseGoals(line: string): GameGoals {
    const teamResults = line.split(',');

    if (teamResults.length !== 2) {
      logger.error(`Please check the formatting of your file on line ${this.lineNumber}`);
      process.exit()
    }

    const formattedTeamResults = teamResults.map((result: string) => {
      result = result.trim();
      const finalSpaceIndex = result.lastIndexOf(' ');
      const teamName = result.substring(0, finalSpaceIndex);
      let goals = result.substring(finalSpaceIndex + 1, result.length);

      try {
        return { team: teamName, goals: parseInt(goals) }
      } catch (e) {
        logger.error(`Please check the formatting of your file on line ${this.lineNumber}`);
        process.exit();
      }
    });

    return {
      teamOneName: formattedTeamResults[0]?.team as string,
      teamOneGoals: formattedTeamResults[0]?.goals as number,
      teamTwoName: formattedTeamResults[1]?.team as string,
      teamTwoGoals: formattedTeamResults[1]?.goals as number
    }
  }

  /**
   * Takes the number of goals made by each team in a match,
   * and returns the number of points each team received.
   */
  calculatePoints(game: GameGoals): GamePoints {
    const tieGame = game.teamOneGoals === game.teamTwoGoals;
    const teamOnePoints = tieGame ? 1 :
      (game.teamOneGoals > game.teamTwoGoals ? 3 : 0);
    const teamTwoPoints = tieGame ? 1 :
      (game.teamTwoGoals > game.teamOneGoals ? 3 : 0);

    return [{
      team: game.teamOneName,
      points: teamOnePoints
    }, {
      team: game.teamTwoName,
      points: teamTwoPoints
    }];
  }

  logTopTeams() {
    logger.info(`Matchday ${this.currentMatchDay}`);

    Object.keys(this.teamPoints).map(team => {
      const teamScores = this.teamPoints[team] || [];
      return {
        team,
        total: teamScores.reduce((a, b) => a + b, 0) || 0
      };
    }).sort((a, b) => {
      if (a.total === b.total) {
        return a.team < b.team ? -1 : 1;
      }
      return a.total > b.total ? -1 : 1;
    }).slice(0, 3).forEach((score) => {
      logger.info(`${score.team}, ${score.total} ${pluralize(score.total, 'pt', 'pts')}`);
    });

    logger.info('');
  }
}

export default LeagueData;
