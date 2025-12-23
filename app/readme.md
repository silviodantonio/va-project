# D3.JS APP

## Docker containers
There are two docker containers:
- `webpack`: contains the webpack application which includes nodejs and d3.js
    - `host port`: `8080`

- `server`: simple server which allows to serve files to d3.js
    - `host port`: `7000`

### Startup instructions
- Run the project: `docker-compose up --build`
- Open a new terminal for `containerName` : `docker-compose exec containerName sh`
- Remove the containers: `docker-compose down`

# Git useful commands
- `git rebase dev` **from the personal branch** to align personal branch to `dev`.
- `git checkout mybranch`, `git reset --hard origin/mybranch` to reset the **local** personal branch to the **remote** personal branch `mybranch`.
- `git log --oneline` to see branch commits (without details) and to which commit each branch is pointing to, then to quit just press `q`.
- `git status` to see branch status with respect to **remote** branches.
- `git remote show origin` to see the default origin/target of fetch and pull, and the general status of all the branches with respect to local copies.
## Just for experts
- `git rebase -i HEAD~n` to manage the latest `n` commits **interactively** while performing a **rebase**.

## Git flow:
1) > `git rebase dev` // dal tuo branch
2) > `git switch dev`
3) > `git merge tuobranch`
4) > `git switch -` // torni al branch precedente (`tuobranch`)