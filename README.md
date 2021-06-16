# Soccer Challenge 

CLI for processing soccer match data!


## Usage

Set up:
```bash
npm run init
```

Run the command:
```bash
league-data [filePath]
```

`[filePath]` - Path to the input file. Input file is expected to be a CSV of match data.

Here is an example of the expected input, in the format of 

`[team 1] [goals], [team 2] [goals]`
```csv
San Jose Earthquakes 3, Santa Cruz Slugs 3
Capitola Seahorses 1, Aptos FC 0
Felton Lumberjacks 2, Monterey United 0
...
```

There is a sample data file in this repo, so you can run:

```bash
league-data ./data/sample-input.csv
```

## Contributing

This CLI is written in Typescript and tested using Jest. 

### Set Up
This repo is setup to use node `v14.16.0`. 

* `nvm use` - Automatically use the node version set in `.nvmrc` 
* `npm install` - Install dependencies
* `npm run build` - Compile the CLI
* `npm link` - Links the bin commands so you can run the CLI locally

Alternatively, you can run:
* `npm run init`

and it will do all of the above for you.

### Development

Here are the available scripts:

```bash
# Compile the CLI once
npm run build

# Compile the CLI in watch mode
npm run build:watch

# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```
