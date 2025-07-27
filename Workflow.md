# How to work on the project

## Environment

For convenience when working on the project, tools from **Node.js** and **npm** are used. All necessary settings have been made. Make sure that the current LTS release of **Node.js** is installed on your work computer. The current **Node.js** version is specified in the `package.json` file in the `node` field. Then, in the terminal, navigate to the project directory and run the command _once_:

```bash
npm install
```

The command will start the process of installing project dependencies from **npm**.

### Scripts

Several scripts are predefined in `package.json`.

#### Compile the project

```bash
npm run compile
```

Creates a `dist` directory and compiles the project.

#### Remove the compiled project

```bash
npm run clean
```

Removes the `dist` directory. Used before compilation.

#### Build the project

```bash
npm run build
```

Performs project build: removes the previously compiled project and recompiles it.

#### Check with linter

```bash
npm run lint
```

Run project verification with the **ESLint** static code analyzer.

The linter checks files only inside the `src` directory.

**Please note** that when running this command, errors are output to the terminal.

#### Fix linter errors

```bash
npm run lint:fix
```

Run fixing of errors found by **ESLint**.

The linter checks files only inside the `src` directory.

#### Fix file formatting

```bash
npm run prettier:format
```

Run fixing of formatting errors found by **Prettier**.

#### Run ts-module without compilation

```bash
npm run ts -- <Path to module with ts-code>
```

The `ts-node` package allows you to execute TS code in Node.js without prior compilation. Used only during development.

#### Run cli module to generate a file with rental offers

```bash
npm run ts -- <Path to cli module> -- --generate <Number of offers> <Path where to save the tsv file with mock data> <API server address>
```

#### Run cli module to import rental offers from tsv file with subsequent saving to database

```bash
npm run ts -- <Path to cli module> -- --import <Path to tsv file with mock data> <Database login> <Database password> <Port on which the database is running> <Database name> <Secret>
```

#### Run JSON-Server

```bash
npm run mock:servre
```

Start the server to provide mock data via api.

#### Run the project

```bash
npm start
```

During project startup, the "Build project" process will be executed and the resulting code will be launched.

#### Run the project in development mode

```bash
npm start:dev
```

During project startup, services from the main.rest.ts file will be initialized. Configuration is described in the nodemon.json file.

## Project Structure

### `src` Directory

Source code of the project: components, modules, and so on. The structure of the `src` directory can be arbitrary.

### `Readme.md` File

Instructions for working with the educational repository.

### `Contributing.md` File

Tips and instructions for making changes to the educational repository.

### Everything else

All other files in the project are service files. Please do not delete or change them arbitrarily. Only if required by the assignment or mentor.
