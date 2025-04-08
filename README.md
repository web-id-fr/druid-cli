# Dru^ID Installer

Dru^ID Installer helps installing [Dru^ID CMS](https://github.com/web-id-fr/druid) in a fresh Laravel application within a Docker environment.

## Requirements

- Node >= 18.2
- Composer 2
- A running Docker daemon

## Usage

Simply run `npx github:web-id-fr/druid-cli new` at your workspace root and follow the instructions.

At the end of the process, you'll be able to log the the Dru^ID admin interface at [http://druid-container.localhost/admin](http://druid-container.localhost/admin)

## Starting / Stopping a project

Once your project has been setup using the `npx github:web-id-fr/druid-cli new`, you can `cd` to the project directory using your terminal and run

`make stop`: To stop all the docker containers

`make start`: To start again the project

`make restart`: Stop + Start

`make fresh`: Reset the database

`seed_demo`: Run the demo seeders

`make destroy`: To delete all the containers

## Contributing

To contribute to the cli tool, you first need to run

```

npm i
npm run watch

```
