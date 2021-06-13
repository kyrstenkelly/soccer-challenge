import chalk from 'chalk';
import fs, { ReadStream } from 'fs';

export const logger = {
  info: (message: string) => {
    console.log(message);
  },

  warn: (message: string) => {
    console.warn(chalk.yellow(message));
  },

  error: (message: string) => {
    console.error(chalk.red(message));
  }
};

export const pluralize = (num: number, one: string, many: string) => {
  return num === 1 ? one : many;
}


export const safeReadStream = (
  filePath: string
): Promise<ReadStream> => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('open', () => resolve(stream))
      .on('error', (err) => reject(err));
  });
};
