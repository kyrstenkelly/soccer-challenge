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
  lineNumber: number = 1;
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

  /**
   * Parse the line, calculate points, and append
   * to the teams' points arrays.
   *
   * If a team's array length has exceeded the current
   * match day, we know we've reached a new match day.
   */
  handleLine(line: string) {
    const goals = this.parseGoals(line);
    const points = this.calculatePoints(goals);

    points.forEach(({ team, points }) => {
      const existingTeamData = this.teamPoints[team] || [];
      const newTeamData = [...existingTeamData, points];

      if (newTeamData.length > this.currentMatchDay) {
        this.logTopTeams();
        this.currentMatchDay++;
      }

      this.teamPoints[team] = newTeamData;
    });

    this.lineNumber++;
  }

  /**
   * Split a match data line into a consumable object detailing
   * the two teams and their goals for the given match.
   */
  parseGoals(line: string): GameGoals {
    const teamResults = line.split(',').map(t => t.trim());

    if (teamResults.length !== 2) {
      logger.error(`Please check the formatting of your file on line ${this.lineNumber}`);
      process.exit();
    }

    const formattedTeamResults = teamResults.map((result: string) => {
      const teamParts = result.split(' ');
      const goals = `${teamParts.pop()}`;
      const teamName = teamParts.join(' ');

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
   * Takes the goals for a given game and convets them
   * to the points each team should receive.
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

  /**
   * Iterate over team points and log the top 3 teams (sorted by
   * points, and then alphabetically) for the current match day.
   */
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
