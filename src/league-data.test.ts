import LeagueData from './league-data';
import { logger } from './utils';

const teamOne = 'Mary Jane';
const teamTwo = 'John Doe';

describe('leagueData', () => {
  let leagueData: LeagueData;
  let processSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    leagueData = new LeagueData();
    processSpy = jest.spyOn(process, 'exit').mockImplementation();
    infoSpy = jest.spyOn(logger, 'info').mockImplementation();
    errorSpy = jest.spyOn(logger, 'error').mockImplementation();
  });

  describe('#handleLine', () => {
    test('it creates a new points array when it sees a new team', () => {
      leagueData.handleLine('kittens 2, puppies 3');
      expect(leagueData.teamPoints).toEqual({
        kittens: [0],
        puppies: [3]
      });
    });

    test('it appends point data when data for the team alraedy exists', () => {
      leagueData.teamPoints = {
        kittens: [0],
        puppies: [3]
      };

      leagueData.handleLine('kittens 2, puppies 2');
      expect(leagueData.teamPoints).toEqual({
        kittens: [0, 1],
        puppies: [3, 1]
      });
    });

    test('it iterates the line number', () => {
      expect(leagueData.lineNumber).toBe(1);
      leagueData.handleLine('kittens 1, puppies 1');
      expect(leagueData.lineNumber).toBe(2);
      leagueData.handleLine('kittens 1, puppies 1');
      expect(leagueData.lineNumber).toBe(3);
      leagueData.handleLine('kittens 1, puppies 1');
    });

    test('it detects when we have cycled through teams and iterates the current match day', () => {
      leagueData.handleLine('kittens 0, puppies 3');
      expect(leagueData.currentMatchDay).toBe(1);
      leagueData.handleLine('ducks 1, swans 2');
      expect(leagueData.currentMatchDay).toBe(1);

      leagueData.handleLine('kittens 3, puppies 4');
      expect(leagueData.currentMatchDay).toBe(2);
      leagueData.handleLine('ducks 0, swans 0');
      expect(leagueData.currentMatchDay).toBe(2);
    });
  });

  describe('#parseGoals', () => {
    test('it parses the goals from a data file line', () => {
      const goals = leagueData.parseGoals(`${teamOne} 3, ${teamTwo} 4`);

      expect(goals).toEqual({
        teamOneName: teamOne,
        teamOneGoals: 3,
        teamTwoName: teamTwo,
        teamTwoGoals: 4
      });
    });

    test('it logs an error if the line does not have two teams', () => {
      leagueData.parseGoals('team one 0');
      expect(errorSpy).toHaveBeenCalled();
      expect(processSpy).toHaveBeenCalled();

      leagueData.parseGoals('team one 0, team two 2, team three 4');
      expect(errorSpy).toHaveBeenCalled();
      expect(processSpy).toHaveBeenCalled();
    });
  });

  describe('#calculatePoints', () => {
    it('calculates the correct points for a tie game', () => {
      const tieGameGoals = leagueData.calculatePoints({
        teamOneName: teamOne,
        teamOneGoals: 2,
        teamTwoName: teamTwo,
        teamTwoGoals: 2
      });

      expect(tieGameGoals).toHaveLength(2);
      expect(tieGameGoals[0]).toEqual({
        team: teamOne,
        points: 1
      });
      expect(tieGameGoals[1]).toEqual({
        team: teamTwo,
        points: 1
      });
    });

    it('calculates the correct points if "team one" won the game', () => {
      const teamOneWins = leagueData.calculatePoints({
        teamOneName: teamOne,
        teamOneGoals: 4,
        teamTwoName: teamTwo,
        teamTwoGoals: 3
      });

      expect(teamOneWins).toHaveLength(2);
      expect(teamOneWins[0]).toEqual({
        team: teamOne,
        points: 3
      });
      expect(teamOneWins[1]).toEqual({
        team: teamTwo,
        points: 0
      });
    });

    it('calculates the correct points if "team two" won the game', () => {
      const teamTwoWins = leagueData.calculatePoints({
        teamOneName: teamOne,
        teamOneGoals: 0,
        teamTwoName: teamTwo,
        teamTwoGoals: 2
      });

      expect(teamTwoWins).toHaveLength(2);
      expect(teamTwoWins[0]).toEqual({
        team: teamOne,
        points: 0
      });
      expect(teamTwoWins[1]).toEqual({
        team: teamTwo,
        points: 3
      });
    });
  });

  describe('#logTopTeams', () => {
    test('it logs the current matchday and the top 3 highest ranking teams', () => {
      leagueData.currentMatchDay = 3;
      leagueData.teamPoints = {
        team_a: [0, 3, 0],
        team_b: [1, 0, 3],
        team_c: [3, 1, 1],
        team_d: [0, 0, 0],
        team_e: [3, 1, 0],
        team_f: [3, 3, 3]
      };
      leagueData.logTopTeams();

      expect(infoSpy).toHaveBeenCalledWith('Matchday 3');
      expect(infoSpy).toHaveBeenCalledWith('team_f, 9 pts');
      expect(infoSpy).toHaveBeenCalledWith('team_c, 5 pts');
      expect(infoSpy).toHaveBeenCalledWith('team_b, 4 pts');
    });

    test('it alphabetizes any teams that scored the same number of points', () => {
      leagueData.currentMatchDay = 1;
      leagueData.teamPoints = {
        dumplings: [0],
        carrots: [0],
        bananas: [3],
        apples: [3],
      };

      leagueData.logTopTeams();

      expect(infoSpy).toHaveBeenCalledWith('Matchday 1');
      expect(infoSpy).toHaveBeenCalledWith('apples, 3 pts');
      expect(infoSpy).toHaveBeenCalledWith('bananas, 3 pts');
      expect(infoSpy).toHaveBeenCalledWith('carrots, 0 pts');
    });

    test('it logs less than three results if there are less than three teams', () => {
      leagueData.currentMatchDay = 1;
      leagueData.teamPoints = {
        team_a: [3],
        team_b: [0]
      };

      leagueData.logTopTeams();

      expect(infoSpy).toHaveBeenCalledWith('Matchday 1');
      expect(infoSpy).toHaveBeenCalledWith('team_a, 3 pts');
      expect(infoSpy).toHaveBeenCalledWith('team_b, 0 pts');
    });

    test('it properly pluralizes singular points', () => {
      leagueData.currentMatchDay = 1;
      leagueData.teamPoints = {
        team_a: [1],
        team_b: [3]
      };
      leagueData.logTopTeams();

      expect(infoSpy).toHaveBeenCalledWith('Matchday 1');
      expect(infoSpy).toHaveBeenCalledWith('team_b, 3 pts');
      expect(infoSpy).toHaveBeenCalledWith('team_a, 1 pt');
    });
  });
});
