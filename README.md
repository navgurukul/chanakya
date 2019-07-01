# Chanakya

## How to run the Project?

1. `npm install` to install the dependencies
2. Set up the DB in MySQL. Read the `How to use Knex Migrations?` section.
3. Create a .env file in the root directory of the project and update the required variables. You can use `sample.env` as the skeleton.
4. `npm start` to run the server. The server will run with auto reloading using nodemon.


## How to use Knex Migrations?

The initial schema created while developing Chanakya is not created as a Knex migration but stored in a SQL file in `sqlScripts/initialSchema.sql`. When you are installing Chanakya for the first time you need to first import this schema into the MySQL DB.

After importing the schema you can run the migrations using `npm run knex migrate:latest`.

*Note: Check `Import Schema` section under `Important Commands` to see how to import the initialSchema.sql file into your DB.*

## Important Commands

### Export Schema of DB
`mysqldump -u root -p --no-data chanakya > schema.sql`

### Import Schema
`mysql -u <insert your username> -p chanakya < sqlScripts/initialSchema.sql`

### Run server with Auto Reload
`npm start`

## Seeding Questions into the DB

You have to run the following command while seeding questions into the DB from the markdown files.

```sh
node lib/seedQuestions/index.js --questionsDir questions
```

*This needs to be run from the root of the project.*

Make sure to re-start the server after doing this because the question paper generation features loads all the questions in memory to load the questions. If you don't restart the server, then it will keep on generating questions from the old question set.

## Importing Questions from MD Files

All the questions in Chanakya are stored in Markdown files stored in `questions/` directory. The database maintains IDs of all the questions and also of every option associated with the questions. Whenever the questions are seeded into the DB the questions & their respective options are assigned IDs. The seeding script has the ability to edit the markdown files and add the question IDs in the file itself.

The questions can be seeded by invoking the `lib/seedQuestions/index.js` script. This script supports two flags. Here is what the two flags mean.

### `--addAllQuestions`
When you use this flag it ignores the question & option IDs in the markdown file and adds all questions as new questions and doesn't edit the existing ones, but just adds every question in the markdown file as new questions.

### `--updateMD`
If this is not specified it adds the questions but doesn't update the markdown files with the IDs returned by the server. This flag should normally be used during development when you want to play around with the questions but don't want to update the markdown files. The markdown files should only be updated when the questions are being seeded on the production environment.

### `--noUpdateToConfig`
when you use this flag you can update the config.json file.

### `--ignoreConfigBucketsAndChoices`
Using this flag you can add new bucket and new question choices if buckets are not exist in your database.
### Running the Script

Here is how you can run the script. The script needs to be run from the root of the project.

```bash
node lib/seedQuestions/index.js --questionsDir questions
```

Running it without any flag above wouldn't update the markdown files. Also it will ensure that the questions with IDs are edited while the questions without IDs are created.


```bash
node lib/seedQuestions/index.js --questionsDir questions --updateMD
```

Running it with `--updateMD` will ensure that the markdown files are edited with the updated IDs returned by the server.

```bash
node lib/seedQuestions/index.js --questionsDir question --addAllQuestions
```

Running it with `--addAllQuestions` flag will ensure that the IDs in the markdown files will be ignored and all questions in the files will be added as new questions.


```bash
node lib/seedQuestions/index.js --questionsDir questions --noUpdateToConfig
```
Running it with `--noUpdateToConfig` flag will update the config.json file and maintained buckets Id and question choice Id


```bash
node lib/seedQuestions/index.js --questionsDir questions --ignoreConfigBucketsAndChoices
```
Running it with `--ignoreConfigBucketsAndChoices` flag will add new bucket and question choice if bucket Id and question choise does not exist.

## How are tests generated?

Our question bank comprises of many questions and the test is always randomly generated from our question bank. The test generation is a little more complex than simply selecting random questions out of the whole question bank. To understand the test generation logic here are some important terms we need to understand.

### Questions
Individual questions in the DB. The final test will comprise of many such questions on basis of the `questions.assessmentConfig` value in the `constants.js` file.

All questions will have a **topic** attached to them and also a **difficulty level**. These two attributes will be used when the test is being generated.

### Question Buckets & Choices
Some part of the test can be designed in a way where you want a set of questions to come one after the other. Example:

1. Question X
2. Question Y
3. Question Z

Let's say yo want X,Y & Z to always come in the above order. But to avoid cheating you would also want different versions of the same question to increase the diversity of questions. So there can be another set of 3 questions. Example:

1. Question X2
2. Question Y2
3. Question Z2

Now we would always need to ensure that X,Y,Z are served together. Also X2,Y2,Z2 are served together. But it can never be something like X,Y2,Z2. The functionality of buckets takes care of this.

Let's say we have designed test in a way where 4 questions of Algebra need to come in a particular order. Something like:

1. Question 1A
2. Question 2A
3. Question 3A
4. Question 4A

But here you would also need multiple such sets of 4 questions so different students can attempt different sets at random to reduce the chance of cheating. So you might have the following sets:

#### Set 1
1. Question 1A
2. Question 2A
3. Question 3A
4. Question 4A

#### Set 2
1. Question 1B
2. Question 2B
3. Question 3B
4. Question 4B

#### Set 3
1. Question 1C
2. Question 2C
3. Question 3C
4. Question 4C

So here some students might be attempting all the 4 in Set 1, some would do all the 4 in Set 2 and so on. But no student would do some questions from `Set 1` and some from `Set 2`.

Here we can create a bucket which will have the name of `Algebra` and create 3 bucket choices which will have Questions from **Set 1**, **Set 2** and **Set 3** respectively.

Every **Question Bucket** will have a name and **Number of Questions** allowed in every bucket choice associated with it.

A **Question Bucket** can have multiple **Question Bucket Choices** associated with it. The number of questions in every choice should be the same as the **Number of Questions** specified in the question bucket.
