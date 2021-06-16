import LeagueData from './league-data';
import { logger, safeReadStream } from './utils';

/**
 * Parse arguments, read file, and pass to
 * LeagueData handler
 */
const start = async () => {
  const args = process.argv.slice(2);
  if (!args.length) {
    logger.error('Please supply a file path.');
    process.exit();
  }

  try {
    const filePath = args[0] as string;
    const readStream = await safeReadStream(filePath)

    new LeagueData(readStream);
  } catch (e) {
    logger.error(`Problem reading file: \n${e}`);
  }
}

start();
