import readline from 'readline';
import { logger, safeReadStream } from './utils';

/**
 * Parse arguments, read file, and pass to
 * TopTeams handler
 */
const start = async () => {
  const args = process.argv.slice(2);
  if (!args.length) {
    logger.error('Please supply a file path.');
    process.exit();
  }

  try {
    const filePath = args[0] as string;
    const readInterface = readline.createInterface({
      input: await safeReadStream(filePath),
    });

    readInterface.on('line', function(line) {
      console.log(line);
    });
  } catch (e) {
    logger.error(`Problem reading file: \n${e}`);
  }
}

start();
