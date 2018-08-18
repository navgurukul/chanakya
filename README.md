# Chanakya

Chanakya is the platform we use to let the new students answer the NavGurukul assessment before they get into NavGurukul. The admission flow after answering the test will eventually also be handled inside Chanakya.

"आदमी अपने जन्म से नहीं अपने कर्मों से महान होता है।"

## How to Set up & Run?
Here are the steps you need to follow to set up Chanakya.

1. Install MySQL.
2. Create a virtualenv. (`python -m venv /path/to/your/virtualenv`)
3. Activate the virtualenv you just created. (`source /path/to/your/virtualenv/bin/activate`)
4. Make sure that the current directory is the root of the project.
5. Set the required environment variables. (`export FLASK_ENV=development; export CHANAKYA_ENVIRONMENT=development`)
6. Run the development server using `FLASK_APP=src flask run`

**Note: The value of `FLASK_ENV` and `CHANAKYA_ENVIRONMENT` should always be the same otherwise you will get an error. Also the possible values are `development`, `staging` and `production`. These values will decide the config file used from the `src/config` folder. The config files are in .gitginore. To get help please contact amar17@navgrukul.org.**

## Git Flow
Let's say you decide to work on issue `#34` from the list of our Github issues. Here's how the git flow would look like.

1. Pull out a branch from `master`. (Till the time we are working on v2 you can pull out a branch from `dev` as that has the most stable v2 code.)
2. Make your changes.
3. Do a pull request from your branch into `master` (or `dev` if you are working on v2)
4. Mark `@rishabhverma` as the reviewer of your pull request.
5. Remind the lazy `@rishabhverma` to approve your pull request.

## How to Migrate the Database?
We are using `flask-migrate` and `sqlalchemy` (through `flask-sqlalchemy`) to handle our MySQL DB. Migrations are stored in the `migrations` folder in the root of this project. We should never make any manual changes to the migrations folder of our projects. All the time the flow would be to make manual changes to the models lying in `models/` directory and then run the migrations script to go about the process of migrations. Here's what it would look like:

1. Make sure your branch is up to date to ensure that any changes you make are the latest ones.
2. Make changes in the model files.
3. Run `flask db migrate`. This will generate migration scripts in the migrations folder.
4. `flask db upgrade` this will upgrade the schema of your DB.

You can read more about the `flask-migrate` documentation [here] (https://flask-migrate.readthedocs.io/en/latest/)
